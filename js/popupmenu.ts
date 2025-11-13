// Copyright (c) 2025, RTE (http://www.rte-france.com)
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
// SPDX-License-Identifier: MPL-2.0
//

export type PopupMenuItemCallbackType = (selection: number, id: string) => void;

export class PopupMenu {
    private container: HTMLElement;
    private items: string[];
    private menuItemCallback: PopupMenuItemCallbackType | null;

    private popupMenu: HTMLElement | null;
    private menuItems: HTMLElement[] = [];
    private focusedIndex: number = -1;

    private id: string = '';

    constructor(container: HTMLElement, menuItems: string[], menuItemCallback: PopupMenuItemCallbackType) {
        this.container = container;
        this.items = menuItems;
        this.menuItemCallback = menuItemCallback;
        this.popupMenu = null;

        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);
    }

    initializeMenu() {
        this.popupMenu = document.createElement('div');
        this.popupMenu.style.position = 'absolute';
        this.popupMenu.style.display = 'none'; // Menu is by default hidden
        this.popupMenu.style.backgroundColor = '#fff';
        this.popupMenu.style.border = '1px solid #ccc';
        this.popupMenu.style.boxShadow = '0px 4px 6px rgba(0, 0, 0, 0.1)';
        this.popupMenu.style.padding = '10px';
        this.popupMenu.style.zIndex = '1000';

        this.items.forEach((item, index) => {
            const menuItem = document.createElement('div');
            menuItem.textContent = item;
            menuItem.style.padding = '5px';
            menuItem.style.cursor = 'pointer';
            menuItem.tabIndex = 0; // Makes the menu item focusable

            // Highlight on hover
            menuItem.addEventListener('mouseover', () => {
                this.focusMenuItem(index);
            });

            menuItem.addEventListener('mouseout', () => {
                menuItem.style.backgroundColor = '';
            });

            menuItem.addEventListener('click', () => {
                this.menuItemCallback?.(index, this.id);
                this.hideMenu();
            });

            this.popupMenu!.appendChild(menuItem);
            this.menuItems.push(menuItem);
        });

        this.container.appendChild(this.popupMenu);
    }

    displayMenu(x: number, y: number, id: string) {
        if (this.popupMenu == null) {
            this.initializeMenu();
        }
        if (this.popupMenu) {
            if (this.popupMenu.style.display == 'none') {
                this.popupMenu.style.left = `${x}px`;
                this.popupMenu.style.top = `${y}px`;
                this.popupMenu.style.display = 'block';
                this.focusedIndex = -1; // Reset focus

                this.id = id;

                // Delay adding the outside click listener to avoid immediate hiding
                setTimeout(() => {
                    document.addEventListener('mousedown', this.handleOutsideClick);
                    document.addEventListener('keydown', this.handleKeydown);
                }, 0);
            }
        }
    }

    hideMenu() {
        if (this.popupMenu) {
            this.popupMenu.style.display = 'none';
            document.removeEventListener('mousedown', this.handleOutsideClick);
            document.removeEventListener('keydown', this.handleKeydown);
        }
    }

    handleOutsideClick(event: MouseEvent) {
        // Check that the event click happened outside the menu
        if (this.popupMenu && !this.popupMenu.contains(event.target as Node)) {
            this.hideMenu();
        }
    }

    handleKeydown(event: KeyboardEvent) {
        if (!this.popupMenu || this.popupMenu.style.display === 'none') return;

        switch (event.key) {
            case 'ArrowDown':
                this.focusNextMenuItem();
                event.preventDefault();
                break;

            case 'ArrowUp':
                this.focusPreviousMenuItem();
                event.preventDefault();
                break;

            case 'Enter':
                if (this.focusedIndex >= 0) {
                    const focusedItem = this.menuItems[this.focusedIndex];
                    focusedItem.click();
                }
                event.preventDefault();
                break;

            case 'Escape':
                this.hideMenu();
                event.preventDefault();
                break;
        }
    }

    focusMenuItem(index: number) {
        if (this.focusedIndex >= 0) {
            this.menuItems[this.focusedIndex].style.backgroundColor = '';
        }

        this.focusedIndex = index;
        this.menuItems[index].focus();
        this.menuItems[index].style.backgroundColor = '#f0f0f0';
    }

    focusNextMenuItem() {
        const nextIndex = (this.focusedIndex + 1) % this.menuItems.length;
        this.focusMenuItem(nextIndex);
    }

    focusPreviousMenuItem() {
        const prevIndex = (this.focusedIndex - 1 + this.menuItems.length) % this.menuItems.length;
        this.focusMenuItem(prevIndex);
    }
}
