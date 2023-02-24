#!/bin/sh -xe
VERSION=0.0.0
gnome-extensions pack -f
zip oskim@esrille.com.shell-extension.zip CONTRIBUTING.md COPYING NOTICE README.md \
ibusHiraganaLib.js utils.js \
layouts/ibus-hiragana.json layouts/ibus-hiragana+new_stickney.json
mv oskim@esrille.com.shell-extension.zip oskim@esrille.com-$VERSION.shell-extension.zip
