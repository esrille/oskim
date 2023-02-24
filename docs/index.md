# はじめに

　<i>On-Screen Keyboard improved for Input Methods</i> (OSKIM) は、[GNOME Shell extension](https://gjs.guide/extensions/)のひとつです。
[GNOME On-Screen Keyboard](https://help.gnome.org/users/gnome-help/stable/keyboard-osk.html) (OSK)の￹機能￺きのう￻を￹拡張￺かくちょう￻します。
　OSKIMは、インプット メソッドごとにべつべつのオンスクリーン キーボードを￹用意￺ようい￻するためのしくみをもっています。
いまのところOSKIMは、￹日本語￺にほんご￻の「[ひらがなIME](https://github.com/esrille/ibus-hiragana)」をサポートしています.

<video controls autoplay muted playsinline>
<source src='screenshots/screenshot.webm' type='video/webm'>
スクリーンショット
</video>

　OSKIMは、Ubuntu 22.04 LTS￹上￺じょう￻のGNOME 42.5でテストしています。
よりあたらしいバージョンのGNOME Shellについては、￹今後￺こんご￻、サポートしていきます。

## インストール￹方法￺ほうほう￻

### 1a. OSKIMのバンドルをダウンロードしてインストール

　まず、OSKIMのバンドルを[Releases](https://github.com/esrille/oskim/releases)ページからダウンロードします。
つづいて、つぎのコマンドを￹実行￺じっこう￻して、OSKIMをインストールします。

```
$ gnome-extensions install oskim@esrille.com-0.0.0.shell-extension.zip
```

### 1b. OSKIMのレポジトリからインストール

　OSKIMのレポジトリをGNOMEシェル￹拡張￺かくちょう￻￹用￺よう￻のディレクトリのなかにつくってインストールすることもできます:

```
$ git clone https://github.com/esrille/oskim.git ~/.local/share/gnome-shell/extensions/oskim@esrille.com
```

### 2. OSKIMを￹有効￺ゆうこう￻にする

　つぎのコマンドを￹実行￺じっこう￻して、OSKIMを￹有効￺ゆうこう￻にします:

```
$ gnome-extensions enable oskim@esrille.com
```

　コマンドラインツールのかわりにGUIツールを￹利用￺りよう￻したいときは、[Extension Manager](https://github.com/mjakeman/extension-manager)を￹利用￺りよう￻することもできます。

### 3. GNOME Shellをリスタートする

　あたらしいGNOME Shell extensionをつかうためには、GNOME Shellをリスタートしないといけません。
リスタートするには、いちど、ログインしなおします。（X11のときは、<span class='key'>Alt</span>+<span class='key'>F2</span>をおして、restartコマンドを￹実行￺じっこう￻すればリスタートできます。）
　OSKIMがうごいていると、トップバーにキーボードのアイコンが￹表示￺ひょうじ￻されます。
このアイコンをタップして、オンスクリーン キーボードを￹表示￺ひょうじ￻したり、とじたりすることもできます。

<br><hr>
<small>Copyright 2023 Esrille Inc.</small>
