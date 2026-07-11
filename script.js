// ==========================================================
// ジャングルバルーンシューティング
// script.js
//
// 主な機能
// ・赤、青、黄色の風船をランダム表示
// ・最初は3個、残り10秒で4個に増える
// ・風船を大きく表示
// ・風船の膨らんだ部分だけHIT判定
// ・ひもや透明部分はMISS判定
// ・HIT、MISS画像と効果音
// ・風船が上へ飛んで消える
// ・20秒でゲーム終了
// ==========================================================


// ==========================================================
// ① HTML要素を取得
// ==========================================================

// ゲーム画面全体
const game =
    document.getElementById("game");

// 風船を入れる場所
const balloonArea =
    document.getElementById("balloonArea");

// 照準
const scope =
    document.getElementById("scope");

// 残り時間
const timeText =
    document.getElementById("time");

// スコア
const scoreText =
    document.getElementById("score");

// HIT・MISS画像
const shotResult =
    document.getElementById("shotResult");

// 終了時の暗い背景
const resultOverlay =
    document.getElementById("resultOverlay");

// 終了メッセージ
const message =
    document.getElementById("message");

// スタートボタン
const startButton =
    document.getElementById("startButton");


// ==========================================================
// ② HTML要素のエラーチェック
// ==========================================================

if (!game) {
    console.error(
        "HTMLエラー：#game が見つかりません"
    );
}

if (!balloonArea) {
    console.error(
        "HTMLエラー：#balloonArea が見つかりません"
    );
}

if (!scope) {
    console.error(
        "HTMLエラー：#scope が見つかりません"
    );
}

if (!timeText) {
    console.error(
        "HTMLエラー：#time が見つかりません"
    );
}

if (!scoreText) {
    console.error(
        "HTMLエラー：#score が見つかりません"
    );
}

if (!shotResult) {
    console.error(
        "HTMLエラー：#shotResult が見つかりません"
    );
}

if (!resultOverlay) {
    console.error(
        "HTMLエラー：#resultOverlay が見つかりません"
    );
}

if (!message) {
    console.error(
        "HTMLエラー：#message が見つかりません"
    );
}

if (!startButton) {
    console.error(
        "HTMLエラー：#startButton が見つかりません"
    );
}


// ==========================================================
// ③ ゲームの基本設定
// ==========================================================

// 制限時間
const GAME_TIME = 20;

// 最初に出す風船の数
const START_BALLOON_COUNT = 3;

// 残り10秒から出す風船の数
const LAST_BALLOON_COUNT = 4;

// 風船を増やす残り時間
const ADD_BALLOON_TIME = 10;

// クリアに必要なスコア
const CLEAR_SCORE = 15;

// CSSで表示している風船のサイズ
const BALLOON_WIDTH = 230;
const BALLOON_HEIGHT = 310;

// 画面端から離す距離
const SCREEN_MARGIN = 25;

// タイトルやスコアを避ける上側の距離
const TOP_MARGIN = 125;


// ==========================================================
// ④ 風船本体の当たり判定設定
// ==========================================================

/*
    風船画像全体を、横1・縦1として考えます。

    HIT_CENTER_X：
    風船本体の中心の横位置

    HIT_CENTER_Y：
    風船本体の中心の縦位置

    HIT_RADIUS_X：
    楕円の横方向の大きさ

    HIT_RADIUS_Y：
    楕円の縦方向の大きさ

    風船本体だけを判定するため、
    ひも部分は範囲に含めません。
*/

const HIT_CENTER_X = 0.5;
const HIT_CENTER_Y = 0.29;

const HIT_RADIUS_X = 0.23;
const HIT_RADIUS_Y = 0.27;


/*
    小さい子向けに当たり判定を少し広げたい場合

    HIT_RADIUS_Xを0.26
    HIT_RADIUS_Yを0.30

    くらいにすると当てやすくなります。
*/


// ==========================================================
// ⑤ 使用する風船画像
// ==========================================================

// ==========================================================
// 風船の種類と点数
// ==========================================================

const normalBalloons = [
    {
        image: "images/redballoon.png",
        points: 1,
        type: "normal"
    },
    {
        image: "images/blueballoon.png",
        points: 1,
        type: "normal"
    },
    {
        image: "images/yellowballoon.png",
        points: 1,
        type: "normal"
    }
];

// レアなゴールド風船
const goldBalloon = {
    image: "images/goldballoon.png",
    points: 5,
    type: "gold"
};

// ゴールド風船の出現率
// 0.1なら10％
const GOLD_BALLOON_RATE = 0.1;

// ==========================================================
// ⑥ 効果音を読み込む
// ==========================================================

// 撃った瞬間
const shotSound =
    new Audio("sound/shot.mp3");

// 風船に当たったとき
const hitSound =
    new Audio("sound/hit.mp3");

// 外したとき
const missSound =
    new Audio("sound/miss.mp3");

// ゲームクリア時
const clearSound =
    new Audio("sound/clear.mp3");


// 効果音の音量
// 0が無音、1が最大
shotSound.volume = 0.45;
hitSound.volume = 0.6;
missSound.volume = 0.4;
clearSound.volume = 0.7;


// ==========================================================
// ⑦ 効果音を再生する関数
// ==========================================================

function playSound(sound) {

    /*
        同じ音を連続で鳴らせるように
        音声データを複製します
    */
    const soundCopy =
        sound.cloneNode();

    soundCopy.volume =
        sound.volume;

    soundCopy.currentTime = 0;

    soundCopy.play().catch(
        function (error) {

            console.warn(
                "効果音を再生できませんでした：",
                error
            );
        }
    );
}


// ==========================================================
// ⑧ ゲーム中に変化する値
// ==========================================================

// 現在のスコア
let score = 0;

// 現在の残り時間
let time = GAME_TIME;

// ゲーム中かどうか
let playing = false;

// ゲームのタイマー
let gameTimer = null;

// HIT・MISSを消すタイマー
let resultTimer = null;

// 後半の風船を追加したかどうか
let extraBalloonAdded = false;

// 風船につける番号
let balloonId = 0;


// ==========================================================
// ⑨ ゲーム設定をコンソールに表示
// ==========================================================

console.log(
    "ゲーム設定を読み込みました"
);

console.log({
    制限時間: GAME_TIME,
    最初の風船数: START_BALLOON_COUNT,
    後半の風船数: LAST_BALLOON_COUNT,
    風船の横幅: BALLOON_WIDTH,
    風船の高さ: BALLOON_HEIGHT,
    クリアスコア: CLEAR_SCORE
});


// ==========================================================
// ⑩ 照準をマウスに追従させる
// ==========================================================

document.addEventListener(
    "mousemove",
    function (event) {

        scope.style.left =
            event.clientX + "px";

        scope.style.top =
            event.clientY + "px";
    }
);


// ==========================================================
// ⑪ ランダムな風船画像を選ぶ
// ==========================================================

// ==========================================================
// 出現させる風船をランダムで選ぶ
// ==========================================================

function getRandomBalloonData() {

    // 0〜1のランダムな数字を作る
    const randomNumber = Math.random();

    // 10％の確率でゴールド風船
    if (randomNumber < GOLD_BALLOON_RATE) {

        console.log("レアなゴールド風船が選ばれました");

        return goldBalloon;
    }

    // 通常風船をランダムで選ぶ
    const randomIndex = Math.floor(
        Math.random() * normalBalloons.length
    );

    return normalBalloons[randomIndex];
}

// ==========================================================
// ⑫ 風船を1個作る
// ==========================================================

// ==========================================================
// 風船を1個作る
// ==========================================================

function createBalloon() {

    // 画像要素を作成
    const balloon = document.createElement("img");

    // CSS用のクラス
    balloon.classList.add("balloon");

    // 出現させる風船を選ぶ
    const balloonData = getRandomBalloonData();

    // 画像を設定
    balloon.src = balloonData.image;

    // 点数を保存
    balloon.dataset.points = balloonData.points;

    // 風船の種類を保存
    balloon.dataset.type = balloonData.type;

    balloon.alt = "風船";
    balloon.draggable = false;

    // デバッグ用の番号
    balloonId++;

    balloon.dataset.number = balloonId;

    // ゴールド風船の場合は専用クラスを追加
    if (balloonData.type === "gold") {
        balloon.classList.add("gold");
    }

    // 画像の読み込み失敗
    balloon.addEventListener(
        "error",
        function () {

            console.error(
                "風船画像を読み込めません：",
                balloon.src
            );
        }
    );

    // 風船を画面に追加
    balloonArea.appendChild(balloon);

    // ランダムな場所へ移動
    moveBalloon(balloon);

    console.log(
        "風船を作成しました",
        {
            番号: balloon.dataset.number,
            種類: balloon.dataset.type,
            点数: balloon.dataset.points,
            画像: balloon.src
        }
    );

    return balloon;
}

// ==========================================================
// ⑬ 風船をランダムな位置へ移動
// ==========================================================

function moveBalloon(balloon) {

    // ゲーム画面の大きさ
    const gameWidth =
        game.clientWidth;

    const gameHeight =
        game.clientHeight;

    // 風船が置ける最大位置
    const maxX =
        gameWidth -
        BALLOON_WIDTH -
        SCREEN_MARGIN;

    const maxY =
        gameHeight -
        BALLOON_HEIGHT -
        SCREEN_MARGIN;

    // ランダムな横位置
    const randomX =
        SCREEN_MARGIN +
        Math.random() *
        Math.max(
            0,
            maxX - SCREEN_MARGIN
        );

    // ランダムな縦位置
    const randomY =
        TOP_MARGIN +
        Math.random() *
        Math.max(
            0,
            maxY - TOP_MARGIN
        );

    balloon.style.left =
        randomX + "px";

    balloon.style.top =
        randomY + "px";

    console.log(
        "風船を移動しました：",
        "風船番号 " +
        balloon.dataset.number,
        "X=" + Math.round(randomX),
        "Y=" + Math.round(randomY)
    );
}


// ==========================================================
// ⑭ 指定された数まで風船を増やす
// ==========================================================

function setBalloonCount(
    targetCount
) {

    let currentCount =
        balloonArea.children.length;

    console.log(
        "風船数を変更します：",
        currentCount,
        "→",
        targetCount
    );

    while (
        currentCount <
        targetCount
    ) {

        createBalloon();

        currentCount++;
    }
}


// ==========================================================
// ⑮ すべての風船を削除する
// ==========================================================

function removeAllBalloons() {

    balloonArea.innerHTML =
        "";

    console.log(
        "すべての風船を削除しました"
    );
}


// ==========================================================
// ⑯ 風船本体に当たったか調べる
// ==========================================================

function findHitBalloon(
    mouseX,
    mouseY
) {

    // 表示中の風船をすべて取得
    const balloons =
        Array.from(
            document.querySelectorAll(
                ".balloon"
            )
        );

    /*
        後から表示された風船を
        優先して判定します
    */
    balloons.reverse();

    for (
        const balloon
        of balloons
    ) {

        // すでに飛んでいる風船は判定しない
        if (
            balloon.classList.contains(
                "hit"
            )
        ) {
            continue;
        }

        // 風船画像の現在位置とサイズ
        const rect =
            balloon.getBoundingClientRect();

        /*
            風船の膨らんだ部分を
            楕円形として判定します
        */

        const centerX =
            rect.left +
            rect.width *
            HIT_CENTER_X;

        const centerY =
            rect.top +
            rect.height *
            HIT_CENTER_Y;

        const radiusX =
            rect.width *
            HIT_RADIUS_X;

        const radiusY =
            rect.height *
            HIT_RADIUS_Y;

        /*
            クリック位置を楕円判定用の
            数値へ変換します
        */

        const normalizedX =
            (
                mouseX -
                centerX
            ) /
            radiusX;

        const normalizedY =
            (
                mouseY -
                centerY
            ) /
            radiusY;

        /*
            値が1以下なら
            楕円の中なのでHIT
        */

        const ellipseValue =
            normalizedX *
            normalizedX +
            normalizedY *
            normalizedY;

        const isInsideBalloon =
            ellipseValue <= 1;

        console.log(
            "当たり判定：",
            "風船番号 " +
            balloon.dataset.number,
            "判定値=" +
            ellipseValue.toFixed(2),
            isInsideBalloon
                ? "HIT範囲内"
                : "範囲外"
        );

        if (
            isInsideBalloon
        ) {

            return balloon;
        }
    }

    // どの風船にも当たっていない
    return null;
}


// ==========================================================
// ⑰ HIT・MISS画像を表示する
// ==========================================================

function showShotResult(
    imagePath,
    x,
    y
) {

    clearTimeout(
        resultTimer
    );

    // 前のアニメーションを解除
    shotResult.classList.remove(
        "show"
    );

    // 表示画像
    shotResult.src =
        imagePath;

    // クリックした位置
    shotResult.style.left =
        x + "px";

    shotResult.style.top =
        y + "px";

    shotResult.style.display =
        "block";

    // アニメーションを再スタート
    void shotResult.offsetWidth;

    shotResult.classList.add(
        "show"
    );

    // 0.5秒後に非表示
    resultTimer =
        setTimeout(
            function () {

                shotResult.classList.remove(
                    "show"
                );

                shotResult.style.display =
                    "none";

            },
            500
        );
}

// ==========================================================
// 撃たれた風船の飛ぶ方向をゆるやかに決める
// ==========================================================

function setBalloonFlyDirection(balloon) {

    // 左右どちらへ飛ぶか
    const direction =
        Math.random() < 0.5
            ? -1
            : 1;

    // 横方向の移動量
    const flyX =
        direction *
        (
            140 +
            Math.random() * 120
        );

    // 上方向の移動量
    const flyY =
        -(
            220 +
            Math.random() * 140
        );

    // 回転量
    const flyRotate =
        direction *
        (
            90 +
            Math.random() * 120
        );

    // CSSへ値を渡す
    balloon.style.setProperty(
        "--fly-x",
        flyX + "px"
    );

    balloon.style.setProperty(
        "--fly-y",
        flyY + "px"
    );

    balloon.style.setProperty(
        "--fly-rotate",
        flyRotate + "deg"
    );

    console.log(
        "しぼみ飛び演出を設定しました",
        {
            風船番号: balloon.dataset.number,
            横方向: flyX,
            縦方向: flyY,
            回転: flyRotate
        }
    );
}
// ==========================================================
// 風船の種類・画像・点数を新しく設定する
// ==========================================================

function resetBalloonData(balloon) {

    // 新しい風船を選ぶ
    const balloonData = getRandomBalloonData();

    // 前のゴールド用クラスを削除
    balloon.classList.remove("gold");

    // 新しい画像
    balloon.src = balloonData.image;

    // 新しい点数
    balloon.dataset.points = balloonData.points;

    // 新しい種類
    balloon.dataset.type = balloonData.type;

    // ゴールド風船なら専用クラスを追加
    if (balloonData.type === "gold") {
        balloon.classList.add("gold");
    }

    console.log(
        "風船を再設定しました",
        {
            番号: balloon.dataset.number,
            種類: balloon.dataset.type,
            点数: balloon.dataset.points
        }
    );
}
// ==========================================================
// 風船に当たったとき
// ==========================================================

function handleHit(
    balloon,
    mouseX,
    mouseY
) {

    // 風船に設定されている点数を取得
    const points = Number(
        balloon.dataset.points
    );

    // ゴールド風船か確認
    const isGold =
        balloon.dataset.type === "gold";

    console.log(
        "HIT",
        {
            風船番号: balloon.dataset.number,
            種類: balloon.dataset.type,
            獲得点数: points
        }
    );

    // HIT音を鳴らす
    playSound(hitSound);

    // 点数分だけスコアを増やす
    score += points;

    // スコア表示を更新
    scoreText.textContent = score;

    // ゴールド風船の場合
    if (isGold) {

        showRareScore(
            mouseX,
            mouseY,
            points
        );

    } else {

        // 通常風船の場合はHIT画像を表示
        showShotResult(
            "images/hit.png",
            mouseX,
            mouseY
        );
    }

    // 飛ぶ方向を先に設定
    setBalloonFlyDirection(balloon);

    // しぼみながら飛ぶアニメーション開始
    balloon.classList.add("hit");

    // アニメーション終了後に新しい風船として再登場
    setTimeout(
        function () {

            // 新しい色・種類・点数に変更
            resetBalloonData(balloon);

            // 新しい位置へ移動
            moveBalloon(balloon);

            // HIT状態を解除
            balloon.classList.remove("hit");

            // 透明度を戻す
            balloon.style.opacity = "1";

        },
        1400
    );
}
// ==========================================================
// ⑲ 外したとき
// ==========================================================

function handleMiss(
    mouseX,
    mouseY
) {

    console.log(
        "MISS：",
        "X=" + mouseX,
        "Y=" + mouseY
    );

    // MISS音
    playSound(
        missSound
    );

    // MISS画像
    showShotResult(
        "images/miss.png",
        mouseX,
        mouseY
    );
}

// ==========================================================
// ゴールド風船を当てたときの表示
// ==========================================================

function showRareScore(
    x,
    y,
    points
) {

    // 表示用の要素を作る
    const rareText =
        document.createElement("div");

    rareText.classList.add("rare-score");

    rareText.innerHTML =
        "RARE！<br>+" + points;

    rareText.style.left =
        x + "px";

    rareText.style.top =
        y + "px";

    game.appendChild(rareText);

    console.log(
        "レア得点を表示：+" + points
    );

    // アニメーション終了後に削除
    setTimeout(
        function () {

            rareText.remove();

        },
        850
    );
}

// ==========================================================
// ⑳ クリックしたときの射撃処理
// ==========================================================

game.addEventListener(
    "click",
    function (event) {

        // ゲーム中でなければ何もしない
        if (!playing) {
            return;
        }

        // 撃った音
        playSound(
            shotSound
        );

        // クリックした場所
        const mouseX =
            event.clientX;

        const mouseY =
            event.clientY;

        /*
            風船の膨らんだ部分に
            当たったか調べます
        */
        const hitBalloon =
            findHitBalloon(
                mouseX,
                mouseY
            );

        // 風船本体に当たった場合
        if (
            hitBalloon
        ) {

            handleHit(
                hitBalloon,
                mouseX,
                mouseY
            );

            return;
        }

        /*
            ひも、透明部分、背景なら
            MISSになります
        */
        handleMiss(
            mouseX,
            mouseY
        );
    }
);


// ==========================================================
// ㉑ ゲーム開始
// ==========================================================

function startGame() {

    console.log(
        "ゲームを開始します"
    );

    // 古いタイマーを停止
    clearInterval(
        gameTimer
    );

    clearTimeout(
        resultTimer
    );

    // 初期値に戻す
    score = 0;

    time = GAME_TIME;

    extraBalloonAdded =
        false;

    balloonId = 0;

    playing = true;

    // 通常カーソルを消す
    document.body.classList.add(
        "playing"
    );

    // 画面表示を更新
    scoreText.textContent =
        score;

    timeText.textContent =
        time;

    // 終了画面を隠す
    message.style.display =
        "none";

    resultOverlay.style.display =
        "none";

    startButton.style.display =
        "none";

    // HIT・MISSを隠す
    shotResult.classList.remove(
        "show"
    );

    shotResult.style.display =
        "none";

    // 照準を表示
    scope.style.display =
        "block";

    // 前の風船を削除
    removeAllBalloons();

    // 最初は3個表示
    setBalloonCount(
        START_BALLOON_COUNT
    );

    // 1秒ごとのタイマー
    gameTimer =
        setInterval(
            function () {

                time--;

                timeText.textContent =
                    time;

                console.log(
                    "残り時間：",
                    time + "秒"
                );

                /*
                    残り10秒になったら
                    風船を4個へ増やす
                */
                if (
                    time ===
                    ADD_BALLOON_TIME &&
                    !extraBalloonAdded
                ) {

                    extraBalloonAdded =
                        true;

                    setBalloonCount(
                        LAST_BALLOON_COUNT
                    );

                    console.log(
                        "後半開始：" +
                        "風船を4個に増やしました"
                    );
                }

                // 0秒で終了
                if (
                    time <= 0
                ) {

                    endGame();
                }

            },
            1000
        );
}


// ==========================================================
// ㉒ ゲーム終了
// ==========================================================

function endGame() {

    console.log(
        "ゲームを終了します"
    );

    console.log(
        "最終スコア：",
        score
    );

    playing = false;

    // タイマー停止
    clearInterval(
        gameTimer
    );

    clearTimeout(
        resultTimer
    );

    // 通常カーソルへ戻す
    document.body.classList.remove(
        "playing"
    );

    // 風船を削除
    removeAllBalloons();

    // 照準を隠す
    scope.style.display =
        "none";

    // HIT・MISSを隠す
    shotResult.classList.remove(
        "show"
    );

    shotResult.style.display =
        "none";

    // 終了画面を表示
    resultOverlay.style.display =
        "block";

    // クリアした場合
    if (
        score >=
        CLEAR_SCORE
    ) {

        playSound(
            clearSound
        );

        message.innerHTML =
            "GAME CLEAR！<br>" +
            "風船をたくさん飛ばしたよ！<br>" +
            "スコア：" +
            score;
    }

    // クリアできなかった場合
    else {

        const remainingScore =
            CLEAR_SCORE -
            score;

        message.innerHTML =
            "おしい！もう一回！<br>" +
            "スコア：" +
            score +
            "<br>" +
            "あと" +
            remainingScore +
            "個でクリア！";
    }

    message.style.display =
        "block";

    startButton.textContent =
        "もう一度あそぶ";

    startButton.style.display =
        "block";
}


// ==========================================================
// ㉓ スタートボタン
// ==========================================================

startButton.addEventListener(
    "click",
    function (event) {

        /*
            ボタンを押したクリックが
            ゲーム画面に伝わるのを防ぐ
        */
        event.stopPropagation();

        startGame();
    }
);


// ==========================================================
// ㉔ 画面サイズが変わったとき
// ==========================================================

window.addEventListener(
    "resize",
    function () {

        if (
            !playing
        ) {
            return;
        }

        const balloons =
            document.querySelectorAll(
                ".balloon"
            );

        balloons.forEach(
            function (balloon) {

                moveBalloon(
                    balloon
                );
            }
        );
    }
);


// ==========================================================
// ㉕ ページを開いた直後
// ==========================================================

// 風船を削除
removeAllBalloons();

// 照準を隠す
scope.style.display =
    "none";

// HIT・MISS画像を隠す
shotResult.style.display =
    "none";

// 終了メッセージを隠す
message.style.display =
    "none";

// 暗い背景を隠す
resultOverlay.style.display =
    "none";

console.log(
    "バルーンシューティングの準備完了"
);