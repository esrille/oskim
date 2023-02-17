/*
 * On-Screen Keyboard improved for Input Methods
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */
'use strict';

const { Clutter, Gio, GLib, Meta, St } = imports.gi;

const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const InputSourceManager = imports.ui.status.keyboard;
const Keyboard = imports.ui.keyboard;

const Me = ExtensionUtils.getCurrentExtension();
const Utils = Me.imports.utils;

// See https://github.com/torvalds/linux/blob/master/include/uapi/linux/input-event-codes.h
const KEY_LEFTCTRL = 29;
const KEY_V = 47;
const KEY_CAPSLOCK = 58;
const KEY_HANGEUL = 122;    // Japanese Kana key
const KEY_HANJA = 123;      // Japanese Eisû key

const IBUS_HIRAGANA_SCHEMA = 'org.freedesktop.ibus.engine.hiragana';

var model = null;

const defaultKeysPre = [
    [
        [{ label: 'tab', width: 1, keyval: Clutter.KEY_Tab }],
        [{ label: 'あ/Ａ', width: 1.5, keyval: Clutter.KEY_Caps_Lock }],
        [{ width: 2, level: 1, extraClassName: 'shift-key-lowercase', icon: 'keyboard-shift-symbolic' }],
        [{ label: '?123', width: 1.5, level: 2 }, { label: 'esc', width: 1, keyval: Clutter.KEY_Escape }, { keyval: Clutter.KEY_space, width: 7.5 }],
    ], [
        [{ label: 'tab', width: 1, keyval: Clutter.KEY_Tab }],
        [{ label: 'あ/Ａ', width: 1.5, keyval: Clutter.KEY_Caps_Lock }],
        [{ width: 2, level: 0, extraClassName: 'shift-key-uppercase', icon: 'keyboard-shift-symbolic' }],
        [{ label: '?123', width: 1.5, level: 2 }, { label: 'esc', width: 1, keyval: Clutter.KEY_Escape }, { keyval: Clutter.KEY_space, width: 7.5 }],
    ], [
        [],
        [{ label: 'あ/Ａ', width: 1.5, keyval: Clutter.KEY_Caps_Lock }],
        [],
        [{ label: 'ABC', width: 1.5, level: 0 }, { label: 'esc', width: 1, keyval: Clutter.KEY_Escape }, { keyval: Clutter.KEY_space, width: 7.5 }],
    ], [
        [],
        [{ label: 'あ/Ａ', width: 1.5, keyval: Clutter.KEY_Caps_Lock }],
        [{ width: 2, extraClassName: 'shift-key-lowercase', icon: 'keyboard-shift-symbolic' }],
        [{ label: 'ABC', width: 1.5, level: 4 }, { label: 'esc', width: 1, keyval: Clutter.KEY_Escape }, { keyval: Clutter.KEY_space, width: 7.5 }],
    ], [
        [{ label: 'tab', width: 1, keyval: Clutter.KEY_Tab }],
        [{ label: 'あ/Ａ', width: 1.5, keyval: Clutter.KEY_Caps_Lock }],
        [{ width: 2, level: 5, extraClassName: 'shift-key-lowercase', icon: 'keyboard-shift-symbolic' }],
        [{ label: '?123', width: 1.5, level: 3 }, { label: 'esc', width: 1, keyval: Clutter.KEY_Escape }, { keyval: Clutter.KEY_space, width: 5 }],
    ], [
        [{ label: 'tab', width: 1, keyval: Clutter.KEY_Tab }],
        [{ label: 'あ/Ａ', width: 1.5, keyval: Clutter.KEY_Caps_Lock }],
        [{ width: 2, level: 4, extraClassName: 'shift-key-uppercase', icon: 'keyboard-shift-symbolic' }],
        [{ label: '?123', width: 1.5, level: 3 }, { label: 'esc', width: 1, keyval: Clutter.KEY_Escape }, { keyval: Clutter.KEY_space, width: 5 }],
    ]
];

const defaultKeysPost = [
    [
        [{ width: 2, keyval: Clutter.KEY_BackSpace, icon: 'edit-clear-symbolic' }],
        [{ width: 2, keyval: Clutter.KEY_Return, extraClassName: 'enter-key', icon: 'keyboard-enter-symbolic' }],
        [{ width: 1, level: 1, extraClassName: 'shift-key-lowercase', icon: 'keyboard-shift-symbolic' }],
        [{ action: 'emoji', icon: 'face-smile-symbolic' }, { action: 'languageMenu', extraClassName: 'layout-key', icon: 'keyboard-layout-symbolic' }, { action: 'hide', extraClassName: 'hide-key', icon: 'go-down-symbolic' }],
    ], [
        [{ width: 2, keyval: Clutter.KEY_BackSpace, icon: 'edit-clear-symbolic' }],
        [{ width: 2, keyval: Clutter.KEY_Return, extraClassName: 'enter-key', icon: 'keyboard-enter-symbolic' }],
        [{ width: 1, level: 0, extraClassName: 'shift-key-uppercase', icon: 'keyboard-shift-symbolic' }],
        [{ action: 'emoji', icon: 'face-smile-symbolic' }, { action: 'languageMenu', extraClassName: 'layout-key', icon: 'keyboard-layout-symbolic' }, { action: 'hide', extraClassName: 'hide-key', icon: 'go-down-symbolic' }],
    ], [
        [{ width: 2, keyval: Clutter.KEY_BackSpace, icon: 'edit-clear-symbolic' }],
        [{ width: 2, keyval: Clutter.KEY_Return, extraClassName: 'enter-key', icon: 'keyboard-enter-symbolic' }],
        [],
        [{ action: 'emoji', icon: 'face-smile-symbolic' }, { action: 'languageMenu', extraClassName: 'layout-key', icon: 'keyboard-layout-symbolic' }, { action: 'hide', extraClassName: 'hide-key', icon: 'go-down-symbolic' }],
    ], [
        [{ width: 2, keyval: Clutter.KEY_BackSpace, icon: 'edit-clear-symbolic' }],
        [{ width: 2, keyval: Clutter.KEY_Return, extraClassName: 'enter-key', icon: 'keyboard-enter-symbolic' }],
        [],
        [{ action: 'emoji', icon: 'face-smile-symbolic' }, { action: 'languageMenu', extraClassName: 'layout-key', icon: 'keyboard-layout-symbolic' }, { action: 'hide', extraClassName: 'hide-key', icon: 'go-down-symbolic' }],
    ], [
        [{ width: 2, keyval: Clutter.KEY_BackSpace, icon: 'edit-clear-symbolic' }],
        [{ width: 2, keyval: Clutter.KEY_Return, extraClassName: 'enter-key', icon: 'keyboard-enter-symbolic' }],
        [{ label: 'ｶﾀｶﾅ', keyval: Clutter.KEY_Shift_R }],
        [{ label: '変換', width: 2.5, keyval: Clutter.KEY_Hangul },
        { action: 'emoji', icon: 'face-smile-symbolic' }, { action: 'languageMenu', extraClassName: 'layout-key', icon: 'keyboard-layout-symbolic' }, { action: 'hide', extraClassName: 'hide-key', icon: 'go-down-symbolic' }],
    ], [
        [{ width: 2, keyval: Clutter.KEY_BackSpace, icon: 'edit-clear-symbolic' }],
        [{ width: 2, keyval: Clutter.KEY_Return, extraClassName: 'enter-key', icon: 'keyboard-enter-symbolic' }],
        [{ width: 1, level: 4, extraClassName: 'shift-key-uppercase', icon: 'keyboard-shift-symbolic' }],
        [{ label: '変換', width: 2.5, keyval: Clutter.KEY_Hangul },
        { action: 'emoji', icon: 'face-smile-symbolic' }, { action: 'languageMenu', extraClassName: 'layout-key', icon: 'keyboard-layout-symbolic' }, { action: 'hide', extraClassName: 'hide-key', icon: 'go-down-symbolic' }],
    ]
];

/* OSKIM: Load alternative layouts used in Hiragana IME
 * cf. https://gitlab.gnome.org/GNOME/gnome-shell/-/issues/1167
 */
function override_loadModel(groupName) {
    Utils.getXkbLayout();
    let path = 'layouts/ibus-hiragana.json';
    if (model.getLayout() == 'new_stickney')
        path = 'layouts/ibus-hiragana+new_stickney.json'
    let layout = Utils.loadJSON(path);
    if (layout && ('map' in layout))
        model._layoutMap = new Map(layout.map);
    else
        model._layoutMap.clear();
    return layout;
}

/* OSKIM: Use defaultKeysPre and defaultKeysPost defined in this file.
 */
function override_getDefaultKeysForRow(row, numRows, level) {
    /* The first 2 rows in defaultKeysPre/Post belong together with
     * the first 2 rows on each keymap. On keymaps that have more than
     * 4 rows, the last 2 default key rows must be respectively
     * assigned to the 2 last keymap ones.
     */
    if (row < 2) {
        return [defaultKeysPre[level][row], defaultKeysPost[level][row]];
    } else if (row >= numRows - 2) {
        let defaultRow = row - (numRows - 2) + 2;
        return [defaultKeysPre[level][defaultRow], defaultKeysPost[level][defaultRow]];
    } else {
        return [null, null];
    }
}

function override_relayout() {
    let monitor = Main.layoutManager.keyboardMonitor;

    if (!monitor)
        return;

    let maxHeight = monitor.height / 3;
    /* OSKIM: Support small screen sizes such as 1024 x 600.
     */
    if (maxHeight < 300)
        maxHeight = Math.min(300, monitor.height / 2);
    this.width = monitor.width;

    if (monitor.width > monitor.height) {
        this.height = maxHeight;
    } else {
        /* In portrait mode, lack of horizontal space means we won't be
        * able to make the OSK that big while keeping size ratio, so
        * we allow the OSK being smaller than 1/3rd of the monitor height
        * there.
        */
        this.height = -1;
        const forWidth = this.get_theme_node().adjust_for_width(monitor.width);
        const [, natHeight] = this.get_preferred_height(forWidth);
        this.height = Math.min(maxHeight, natHeight);
    }
}

function override_setActiveLayer(activeLevel) {
    /* OSKIM: Remember the current active layer.
     */
    this._activeLevel = activeLevel;

    let activeGroupName = this._keyboardController.getCurrentGroup();
    let layers = this._groups[activeGroupName];
    let currentPage = layers[activeLevel];

    if (this._currentPage == currentPage) {
        this._updateCurrentPageVisible();
        return;
    }

    if (this._currentPage != null) {
        this._setCurrentLevelLatched(this._currentPage, false);
        this._currentPage.disconnect(this._currentPage._destroyID);
        this._currentPage.hide();
        delete this._currentPage._destroyID;
    }

    this._currentPage = currentPage;
    this._currentPage._destroyID = this._currentPage.connect('destroy', () => {
        this._currentPage = null;
    });
    this._updateCurrentPageVisible();
}

function override_commitString(string, fromKey) {
    if (string == null)
        return false;
    /* Let ibus methods fall through keyval emission */
    if (fromKey && this._currentSource.type == InputSourceManager.INPUT_SOURCE_TYPE_IBUS)
        return false;

    /* OSKIM: There seems to be no generic method to send a Unicode string to the IME
     * at this point. Use copy and paste as a workaround for now.
     */
    model._clipboard.set_text(St.ClipboardType.CLIPBOARD, string);
    // Ctrl-V
    this._virtualDevice.notify_key(Clutter.get_current_event_time() * 1000,
                                   KEY_LEFTCTRL, Clutter.KeyState.PRESSED);
    this._virtualDevice.notify_key(Clutter.get_current_event_time() * 1000,
                                   KEY_V, Clutter.KeyState.PRESSED);
    this._virtualDevice.notify_key(Clutter.get_current_event_time() * 1000,
                                   KEY_V, Clutter.KeyState.RELEASED);
    this._virtualDevice.notify_key(Clutter.get_current_event_time() * 1000,
                                   KEY_LEFTCTRL, Clutter.KeyState.RELEASED);
    return true;
}

/* OSKIM: Convert a Unicode keyval into a ASCII keyval that can be handled by IME.
 */
function override_keyvalPress(keyval) {
    let c = String.fromCharCode(Clutter.keysym_to_unicode(keyval));
    if (model._layoutMap.has(c)) {
        c = model._layoutMap.get(c);
        let code = Clutter.unicode_to_keysym(c.codePointAt(0));
        this._virtualDevice.notify_keyval(Clutter.get_current_event_time() * 1000,
                                          code, Clutter.KeyState.PRESSED);
    } else if (keyval != Clutter.KEY_Caps_Lock) {
        this._virtualDevice.notify_keyval(Clutter.get_current_event_time() * 1000,
                                          keyval, Clutter.KeyState.PRESSED);
    }
}

/* OSKIM: Control the active level of the Japanese keyboard layouts.
 */
function override_keyvalRelease(keyval) {
    let c = String.fromCharCode(Clutter.keysym_to_unicode(keyval));
    if (model._layoutMap.has(c)) {
        c = model._layoutMap.get(c);
        let code = Clutter.unicode_to_keysym(c.codePointAt(0));
        this._virtualDevice.notify_keyval(Clutter.get_current_event_time() * 1000,
                                          code, Clutter.KeyState.RELEASED);
        if (Main.keyboard.keyboardActor._activeLevel == 5 && Main.keyboard.keyboardActor._prefixed) {
            Main.keyboard.keyboardActor._setActiveLayer(4);
            Main.keyboard.keyboardActor._prefixed = false;
        }
    } else if (keyval == Clutter.KEY_Caps_Lock) {
        let keycode = KEY_CAPSLOCK;
        if (model.getXkbLayout() == 'jp') {
            if (3 <= Main.keyboard.keyboardActor._activeLevel)
                keycode = KEY_HANJA;
            else
                keycode = KEY_HANGEUL;
        }
        this._virtualDevice.notify_key(Clutter.get_current_event_time() * 1000,
                                       keycode, Clutter.KeyState.PRESSED);
        this._virtualDevice.notify_key(Clutter.get_current_event_time() * 1000,
                                       keycode, Clutter.KeyState.RELEASED);
    } else {
        this._virtualDevice.notify_keyval(Clutter.get_current_event_time() * 1000,
                                          keyval, Clutter.KeyState.RELEASED);
        if (keyval == Clutter.KEY_space) {
            if (Main.keyboard.keyboardActor._activeLevel == 4) {
                Main.keyboard.keyboardActor._setActiveLayer(5);
                Main.keyboard.keyboardActor._prefixed = true;
            } else if (Main.keyboard.keyboardActor._activeLevel == 5 && Main.keyboard.keyboardActor._prefixed)
                Main.keyboard.keyboardActor._setActiveLayer(4);
        } else if (keyval == Clutter.KEY_Hangul) {
            if (Main.keyboard.keyboardActor._activeLevel == 5) {
                Main.keyboard.keyboardActor._setActiveLayer(4);
                Main.keyboard.keyboardActor._prefixed = false;
            }
        }
    }
}

var IbusHiraganaModel = class {
    constructor() {
        log('IbusHiraganaModel.constructor');
        this._clipboard = St.Clipboard.get_default();
        this._keyboardStateChangedId = 0;
        this._settingsChangeId = 0;
        this._keymap = Clutter.get_default_backend().get_default_seat().get_keymap();
        this._capslock = this.getCapslockState();
        this._ibusHiraganaSettings = new Gio.Settings({ schema_id: IBUS_HIRAGANA_SCHEMA });
        this._layoutMap = new Map();
    }

    enable(extension) {
        log('IbusHiraganaModel.enable');
        this._xkbLayout = Utils.getXkbLayout();

        Keyboard.Keyboard.prototype['_getDefaultKeysForRow'] = override_getDefaultKeysForRow;
        Keyboard.Keyboard.prototype['_relayout'] = override_relayout;
        Keyboard.Keyboard.prototype['_setActiveLayer'] = override_setActiveLayer;
        Keyboard.KeyboardController.prototype['commitString'] = override_commitString;
        Keyboard.KeyboardController.prototype['keyvalPress'] = override_keyvalPress;
        Keyboard.KeyboardController.prototype['keyvalRelease'] = override_keyvalRelease;
        Keyboard.KeyboardModel.prototype['_loadModel'] = override_loadModel;
        this._keyboardStateChangedId = this._keymap.connect('state-changed', this.onStateChanged.bind(this));
        this._settingsChangeId = this._ibusHiraganaSettings.connect('changed', this.onSettingsChanged.bind(this));
        model = this;
    }

    disable(extension) {
        log('IbusHiraganaModel.disable');

        Keyboard.Keyboard.prototype['_getDefaultKeysForRow'] = extension.backup_getDefaultKeysForRow;
        Keyboard.Keyboard.prototype['_relayout'] = extension.backup_relayout;
        Keyboard.Keyboard.prototype['_setActiveLayer'] = extension.backup_setActiveLayer;
        Keyboard.KeyboardController.prototype['keyvalPress'] = extension.backup_keyvalPress;
        Keyboard.KeyboardController.prototype['keyvalRelease'] = extension.backup_keyvalRelease;
        Keyboard.KeyboardController.prototype['commitString'] = extension.backup_commitString;
        Keyboard.KeyboardModel.prototype['_loadModel'] = extension.backup_loadModel;
        this._keymap.disconnect(this._keyboardStateChangedId);
        this._keyboardStateChangedId = 0;
        this._ibusHiraganaSettings.disconnect(this._settingsChangeId);
        this._settingsChangeId = 0;
        this._layoutMap.clear();
        model = null;
    }

    syncMode() {
        let mode = this._ibusHiraganaSettings.get_string('mode');
        switch (mode) {
        case 'あ':
        case 'ア':
        case 'ｱ':
            Main.keyboard.keyboardActor._setActiveLayer(4);
            Main.keyboard.keyboardActor._latched = true;
            break;
        case 'A':
        case 'Ａ':
        default:
            Main.keyboard.keyboardActor._setActiveLayer(0);
            Main.keyboard.keyboardActor._latched = false;
            break;
        }
    }

    getCapslockState() {
        return this._keymap.get_caps_lock_state();
    }

    onStateChanged(actor, event) {
        if (this._capslock == this.getCapslockState())
            return;
        this._capslock = this.getCapslockState();
        log(`onStateChanged: ${this._keymap.get_caps_lock_state()}`);
        if (!Main.keyboard.keyboardActor)
            return;
        if (model.getXkbLayout() == 'jp')
            return;
        if (this._capslock) {
            Main.keyboard.keyboardActor._setActiveLayer(4);
            Main.keyboard.keyboardActor._latched = true;
        } else {
            Main.keyboard.keyboardActor._setActiveLayer(0);
            Main.keyboard.keyboardActor._latched = false;
        }
    }

    onSettingsChanged(settings, key) {
        log(`onSettingsChanged: ${key}`);
        if (!Main.keyboard.keyboardActor)
            return;
        if (key == 'layout') {
            // Emit 'groups-changed' to _keyboardController to call
            // Keyboard._onKeyboardGroupsChanged and refresh keyboard layout.
            Main.keyboard.keyboardActor._keyboardController.emit('groups-changed');
        } else if (key == 'mode') {
            this.syncMode();
        }
    }

    getLayout() {
        return this._ibusHiraganaSettings.get_string('layout');
    }

    getXkbLayout() {
        return this._xkbLayout;
    }
}
