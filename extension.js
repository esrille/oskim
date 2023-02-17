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

const { Clutter, Gio, GObject, St } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const InputSourceManager = imports.ui.status.keyboard;
const Keyboard = imports.ui.keyboard;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;

const Me = ExtensionUtils.getCurrentExtension();
const IbusHiraganaLib = Me.imports.ibusHiraganaLib;
const Utils = Me.imports.utils;

const A11Y_APPLICATIONS_SCHEMA = 'org.gnome.desktop.a11y.applications';
const SHOW_KEYBOARD = 'screen-keyboard-enabled';

var indicator = null;

const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init(extension) {
        super._init(0.0, 'On-Screen Keyboard improved for Input Methods');

        this._extension = extension;
        this._modelMap = new Map();
        this._modelMap.set('ibus-hiragana', new IbusHiraganaLib.IbusHiraganaModel());
        this._currentModel = null;

        let icon = new St.Icon({
            icon_name: 'input-keyboard-symbolic',
            style_class: 'system-status-icon'
        });
        this.add_child(icon);
        this.connect('button-press-event', (actor, event) => {
            this._toggleKeyboard(extension);
            return Clutter.EVENT_STOP;
        });
        this.connect('touch-event', (actor, event) => {
            if (event.type() !== Clutter.EventType.TOUCH_BEGIN)
                return Clutter.EVENT_PROPAGATE;
            this._toggleKeyboard(extension);
            return Clutter.EVENT_STOP;
        });
    }

    // Because PanelMenu.Button is a ClutterActor, overriding the destroy()
    // method directly is bad idea. Instead PanelMenu.Button connects to
    // the signal, so we can override that callback and chain-up.
    _onDestroy() {
        this.disable();
        this._modelMap.clear();
        this._extension = null;

        // Chaining-up to PanelMenu.Button's callback
        super._onDestroy();
    }

    _toggleKeyboard(extension) {
        if (Main.keyboard.visible) {
            extension._a11yApplicationsSettings.set_boolean(SHOW_KEYBOARD, false);
            Main.keyboard.close();
        } else {
            extension._a11yApplicationsSettings.set_boolean(SHOW_KEYBOARD, true);
            Main.keyboard.open(0);
            this._currentModel.syncMode();
        }
    }

    enable(name) {
        let model = this._modelMap.get(name);
        if (model == this._currentModel) {
            return false;
        }
        this.disable();
        if (model) {
            this._currentModel = model;
            this._currentModel.enable(this._extension);
        }
        return true;
    }

    disable() {
        if (this._currentModel) {
            this._currentModel.disable(this._extension);
            this._currentModel = null;
        }
    }
});

function override_onGroupChanged() {
    this._ensureKeysForGroup(this._keyboardController.getCurrentGroup());
    if (!this._currentPage) {
        this._setActiveLayer(0);
    }
}

function override_onSourceChanged(inputSourceManager, _oldSource) {
    let source = inputSourceManager.currentSource;
    this._currentSource = source;

    const typeId = source.type + '-' + source.id;
    log(`override_onSourceChanged: ${typeId} ${_oldSource}`);
    let enabled = indicator.enable(typeId);

    this.emit('active-group', source.id);
    if (enabled) {
        Main.keyboard.keyboardActor._setActiveLayer(0);
    }
}

class Extension {
    constructor(uuid) {
        log(Me.path);

        this._uuid = uuid;
        this._a11yApplicationsSettings = new Gio.Settings({ schema_id: A11Y_APPLICATIONS_SCHEMA });

        this.backup_loadDefaultKeys = Keyboard.Keyboard.prototype['_loadDefaultKeys'];
        this.backup_getDefaultKeysForRow = Keyboard.Keyboard.prototype['_getDefaultKeysForRow'];
        this.backup_onGroupChanged = Keyboard.Keyboard.prototype['_onGroupChanged'];
        this.backup_relayout = Keyboard.Keyboard.prototype['_relayout'];
        this.backup_setActiveLayer = Keyboard.Keyboard.prototype['_setActiveLayer'];
        this.backup_onSourceChanged = Keyboard.KeyboardController.prototype['_onSourceChanged'];
        this.backup_commitString = Keyboard.KeyboardController.prototype['commitString'];
        this.backup_keyvalPress = Keyboard.KeyboardController.prototype['keyvalPress'];
        this.backup_keyvalRelease = Keyboard.KeyboardController.prototype['keyvalRelease'];
        this.backup_loadModel = Keyboard.KeyboardModel.prototype['_loadModel'];
    }

    enable() {
        let opened = this._close();
        indicator = new Indicator(this);
        Main.panel.addToStatusArea(this._uuid, indicator);
        Keyboard.Keyboard.prototype['_onGroupChanged'] = override_onGroupChanged;
        Keyboard.KeyboardController.prototype['_onSourceChanged'] = override_onSourceChanged;
        indicator.enable(Utils.getCurrentInputSource());
        if (opened)
            this._open();
    }

    disable() {
        let opened = this._close();
        if (indicator !== null) {
            indicator.destroy();
            indicator = null;
        }
        Keyboard.Keyboard.prototype['_onGroupChanged'] = this.backup_onGroupChanged;
        Keyboard.KeyboardController.prototype['_onSourceChanged'] = this.backup_onSourceChanged;
        if (opened)
            this._open();
    }

    /* Keyboard creating steps in KeyBoardManager._syncEnabled()
     */
    _open() {
        if (!Main.keyboard._keyboard) {
            Main.keyboard._keyboard = new Keyboard.Keyboard();
            Main.keyboard._keyboard.connect('visibility-changed', () => {
                Main.keyboard._bottomDragAction.enabled = !Main.keyboard._keyboard.visible;
            });
        }
    }

    /* Keyboard closing steps in KeyBoardManager._syncEnabled()
     */
    _close() {
        if (!Main.keyboard._keyboard)
            return false;
        Main.keyboard._keyboard.close(true);
        Main.keyboard._keyboard.setCursorLocation(null);
        Main.keyboard._keyboard.destroy();
        Main.keyboard._keyboard = null;
        Main.keyboard._bottomDragAction.enabled = true;
        return true;
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}
