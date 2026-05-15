# Copyright (c) 2026, RTE (http://www.rte-france.com)
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
# SPDX-License-Identifier: MPL-2.0

import math
from typing import Optional
import pandas as pd
import pypowsybl as pp

def parse_uncertain_injections(data: dict) -> dict:
    result = {}
    for entry in data["uncertainInjections"]:
        eid = entry["id"]
        if "absolute" in entry:
            result[eid] = {"relative": False, "bounds": tuple(entry["absolute"])}
        elif "relative" in entry:
            result[eid] = {"relative": True, "bounds": tuple(entry["relative"])}
        else:
            raise ValueError(f"Entry '{eid}' has neither 'absolute' nor 'relative' key.")
    return result


def get_interval(injections: dict, injection_id: str, value: float) -> tuple[float, float]:
    inj = injections[injection_id]
    u_min, u_max = inj["bounds"]
    if inj["relative"]:
        return (value + value * u_min / 100.0, value + value * u_max / 100.0)
    else:
        return (u_min, u_max)


def _valid_sfcc_pct(value) -> Optional[float]:
    if value is None or not (0.0 <= value <= 100.0):
        return None
    return value


def get_bus_injection_details(
    bus_id: str,
    injections: Optional[dict],
    injections_df: pd.DataFrame,
    generators_df: pd.DataFrame,
    sfcc: Optional[dict] = None,
) -> dict:
    result = {"generators": [], "loads": []}
    processed_gen_ids = set()

    if injections is not None:
        bus_df = injections_df[
            (injections_df["bus_id"] == bus_id) &
            (injections_df.index.isin(injections))
        ]
        for inj_id, row in bus_df.iterrows():
            if row["type"] == "GENERATOR":
                gen_row = generators_df.loc[inj_id]
                gen_p = -row["p"]
                result["generators"].append({
                    "id": inj_id,
                    "p": gen_p,
                    "uncertainty": get_interval(injections, inj_id, gen_p),
                    "pmin_pmax": (float(gen_row["min_p"]), float(gen_row["max_p"])),
                    "sfcc_pct": _valid_sfcc_pct(sfcc.get(inj_id)) if sfcc is not None else None,
                })
                processed_gen_ids.add(inj_id)
            elif row["type"] == "LOAD":
                result["loads"].append({
                    "id": inj_id,
                    "p": row["p"],
                    "uncertainty": get_interval(injections, inj_id, row["p"]),
                })

    if sfcc is not None:
        bus_gen_df = injections_df[
            (injections_df["bus_id"] == bus_id) &
            (injections_df["type"] == "GENERATOR") &
            (injections_df.index.isin(sfcc)) &
            (~injections_df.index.isin(processed_gen_ids))
        ]
        for inj_id, row in bus_gen_df.iterrows():
            gen_row = generators_df.loc[inj_id]
            result["generators"].append({
                "id": inj_id,
                "p": -row["p"],
                "uncertainty": None,
                "pmin_pmax": (float(gen_row["min_p"]), float(gen_row["max_p"])),
                "sfcc_pct": _valid_sfcc_pct(sfcc[inj_id]),
            })

    return result


def format_generator(gen: dict, sfcc_pct: Optional[float] = None) -> str:
    p_min, p_max = gen["pmin_pmax"]
    uncertainty = gen.get("uncertainty")
    has_interval = (
        uncertainty is not None
        and math.isfinite(uncertainty[0])
        and math.isfinite(uncertainty[1])
    )
    if has_interval:
        u_min, u_max = uncertainty
        u_min_str, u_max_str = str(u_min), str(u_max)
    else:
        u_min_str, u_max_str = '', ''
    sfcc_str = '' if sfcc_pct is None else str(sfcc_pct)
    return f"§I§GEN|{gen['id']}|{gen['p']}|{u_min_str}|{u_max_str}|{p_min}|{p_max}|{sfcc_str}"


def format_load(load: dict) -> str:
    u_min, u_max = load["uncertainty"]
    return f"§I§LOAD|{load['id']}|{load['p']}|{u_min}|{u_max}"


def _build_vl_descriptions_df(
    vls_df: pd.DataFrame,
    buses_df: pd.DataFrame,
    injections_df: Optional[pd.DataFrame] = None,
    generators_df: Optional[pd.DataFrame] = None,
    injections: Optional[dict] = None,
    sfcc: Optional[dict] = None,
) -> pd.DataFrame:
    records = []
    has_any_data = (
        injections_df is not None
        and generators_df is not None
        and (injections is not None or sfcc is not None)
    )

    for vl_id in vls_df.index:
        records.append({
            "id": vl_id,
            "type": "HEADER",
            "description": vl_id,
        })

        if not has_any_data:
            continue

        vl_buses = buses_df[buses_df["voltage_level_id"] == vl_id]

        for bus_id in vl_buses.index:
            bus_data = get_bus_injection_details(bus_id, injections, injections_df, generators_df, sfcc)

            for gen in bus_data["generators"]:
                records.append({
                    "id": vl_id,
                    "type": "FOOTER",
                    "description": format_generator(gen, gen.get("sfcc_pct")),
                })

            for load in bus_data["loads"]:
                records.append({
                    "id": vl_id,
                    "type": "FOOTER",
                    "description": format_load(load),
                })

    return pd.DataFrame.from_records(data=records, index="id")


def build_vl_descriptions_df(
    network: pp.network.Network,
    injections_uncertainties: Optional[dict] = None,
    secondary_control: Optional[dict] = None,
) -> pd.DataFrame:
    injections_df = network.get_injections()
    injections_filtered_df = injections_df[injections_df['type'].isin(['GENERATOR', 'LOAD'])].sort_index()
    return _build_vl_descriptions_df(network.get_voltage_levels(),
                         network.get_buses(),
                         injections_filtered_df,
                         network.get_generators(),
                         injections_uncertainties,
                         secondary_control)


def format_gen_diff(gen_id: str, p_n1: float, p_n2: float, delta_p: float, pmin: float, pmax: float) -> str:
    return f"§D§GEN|{gen_id}|{p_n1}|{p_n2}|{delta_p}|{pmin}|{pmax}"


def build_vl_descriptions_for_gens_diff_df(n1: pp.network.Network, n2: pp.network.Network, epsilon: float = 1e-6) -> pd.DataFrame:
    gens_n1 = n1.get_generators()
    gens_n2 = n2.get_generators()

    gen_inj_n1 = n1.get_injections()
    gen_inj_n1 = gen_inj_n1[gen_inj_n1['type'] == 'GENERATOR']

    gen_inj_n2 = n2.get_injections()
    gen_inj_n2 = gen_inj_n2[gen_inj_n2['type'] == 'GENERATOR']

    common_ids = set(gens_n1.index) & set(gens_n2.index) & set(gen_inj_n1.index) & set(gen_inj_n2.index)

    buses_df = n1.get_buses()
    vls_df = n1.get_voltage_levels()

    records = []
    for vl_id in vls_df.index:
        records.append({"id": vl_id, "type": "HEADER", "description": vl_id})

        vl_buses = buses_df[buses_df["voltage_level_id"] == vl_id]
        for bus_id in vl_buses.index:
            bus_gens = gen_inj_n1[gen_inj_n1['bus_id'] == bus_id]
            for gen_id, row in bus_gens.iterrows():
                if gen_id not in common_ids:
                    continue
                p_n1 = -row["p"]
                p_n2 = -gen_inj_n2.loc[gen_id, "p"]
                if abs(p_n2 - p_n1) <= epsilon:
                    continue
                gen_row = gens_n1.loc[gen_id]
                records.append({
                    "id": vl_id,
                    "type": "FOOTER",
                    "description": format_gen_diff(
                        gen_id, p_n1, p_n2, p_n2 - p_n1,
                        float(gen_row["min_p"]), float(gen_row["max_p"])
                    ),
                })

    return pd.DataFrame.from_records(data=records, index="id")
