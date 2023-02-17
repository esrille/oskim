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

const { Gio } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const DESKTOP_INPUT_SOURCES_SCHEMA = 'org.gnome.desktop.input-sources';
const KEY_MRU_SOURCES = 'mru-sources';

function dumpStack() {
    try {
        throw new Error();
    } catch (e) {
        log(e.stack);
    }
}

function loadText(path) {
    log(`loadText('${path}'): from ${Me.path}`);
    let f = Gio.File.new_for_path(Me.path + '/' + path);
    try {
        let [success, contents] = f.load_contents(null);
        let decoder = new TextDecoder();
        return decoder.decode(contents);
    } catch (e) {
        log(`Failed to load text file ${path} ${e}`);
    }
    return '';
}

function loadJSON(path) {
    log(`loadJSON('${path}'): from ${Me.path}`);
    let f = Gio.File.new_for_path(Me.path + '/' + path);
    try {
        let [success, contents] = f.load_contents(null);
        let decoder = new TextDecoder();
        return JSON.parse(decoder.decode(contents));
    } catch (e) {
        log(`Failed to load JSON file ${path} ${e}`);
    }
    return null;
}

function getXkbLayout() {
    let layout = 'us';
    let settings = new Gio.Settings({ schema_id: DESKTOP_INPUT_SOURCES_SCHEMA });
    let sources = settings.get_value(KEY_MRU_SOURCES);
    let nSources = sources.n_children();
    for (let i = 0; i < nSources; ++i) {
        let [type, id] = sources.get_child_value(i).deep_unpack();
        if (type == 'xkb') {
            layout = id;
            break;
        }
    }
    log(`getXkbLayout: ${layout}`);
    return layout;
}

function getCurrentInputSource() {
    let settings = new Gio.Settings({ schema_id: DESKTOP_INPUT_SOURCES_SCHEMA });
    let sources = settings.get_value(KEY_MRU_SOURCES);
    let nSources = sources.n_children();
    if (0 < nSources) {
         let [type, id] = sources.get_child_value(0).deep_unpack();
         return type + '-' + id;
   }
   return 'xkb-us';
}
