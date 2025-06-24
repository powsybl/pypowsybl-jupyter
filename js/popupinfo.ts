// Copyright (c) 2025, RTE (http://www.rte-france.com)
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
// SPDX-License-Identifier: MPL-2.0
//

type Point = { x: number; y: number };

type FetchElementInfoFn = (
    elementId: string,
    elementType: string
) => Promise<string>;

export class PopupInfo {
    container: HTMLElement;
    fetchElementInfo: FetchElementInfoFn;
    infoBox: HTMLDivElement;
    lastRequestId: number = 0;
    debouncedShowInfo: (
        mousex: number,
        mousey: number,
        elementId: string,
        elementType: string,
        requestId: number
    ) => Promise<void>;

    constructor(
        container: HTMLElement,
        fetchElementInfo: FetchElementInfoFn,
        debounceDelay: number = 200
    ) {
        this.container = container;
        this.fetchElementInfo = fetchElementInfo;

        this.infoBox = document.createElement('div');

        this.infoBox.style.position = 'absolute';
        this.infoBox.style.display = 'none';
        this.infoBox.style.backgroundColor = 'white';
        this.infoBox.style.border = '1px solid black';
        this.infoBox.style.padding = '5px';
        this.infoBox.style.pointerEvents = 'none';
        this.infoBox.style.fontFamily = 'sans-serif';
        this.infoBox.style.fontSize = '12px';
        this.infoBox.style.zIndex = '900';

        this.container.appendChild(this.infoBox);

        this.debouncedShowInfo = this.debounce(
            this.showInfo.bind(this),
            debounceDelay
        );
    }

    debounce<F extends (...args: any[]) => void>(func: F, wait: number): F {
        let timeoutId: number | undefined;
        return ((...args: Parameters<F>) => {
            clearTimeout(timeoutId);
            timeoutId = window.setTimeout(() => func(...args), wait);
        }) as F;
    }

    private async showInfo(
        mousex: number,
        mousey: number,
        elementId: string,
        elementType: string,
        requestId: number
    ): Promise<void> {
        if (requestId === this.lastRequestId) {
            const text: string = await this.fetchElementInfo(
                elementId,
                elementType
            );
            this.infoBox.innerHTML = text;
            this.infoBox.style.left = `${mousex + 10}px`;
            this.infoBox.style.top = `${mousey + 10}px`;
            if (text !== '') {
                this.infoBox.style.display = 'block';
            } else {
                this.infoBox.style.display = 'none';
            }
        }
    }

    handleHover(
        shouldDisplay: boolean,
        mousePosition: Point | null,
        elementId: string,
        elementType: string
    ): void {
        this.lastRequestId++;
        if (shouldDisplay && mousePosition) {
            this.debouncedShowInfo(
                mousePosition.x,
                mousePosition.y,
                elementId,
                elementType,
                this.lastRequestId
            );
        } else {
            this.infoBox.style.display = 'none';
            this.infoBox.textContent = '';
        }
    }
}
