// ==========================================================
// ジャングルバルーンシューティング
// パソコン側
//
// ・Firebaseでスマホの発射を受信
// ・ArUcoマーカーで照準操作
// ・マウス操作なし
// ・風船の膨らんだ部分だけ当たり判定
// ==========================================================


// ==========================================================
// Firebase SDK
// ==========================================================

import {
    initializeApp
} from
"https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import {
    getAuth,
    signInAnonymously
} from
"https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    getDatabase,
    ref,
    onValue
} from
"https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js";


// ==========================================================
// Firebase設定
// ==========================================================

const firebaseConfig = {
    apiKey:
        "AIzaSyCC7CgZIP6RsU18XK2Vb_7_4nk9Cj_5NcM",

    authDomain:
        "wakutatu-shooting.firebaseapp.com",

    databaseURL:
        "https://wakutatu-shooting-default-rtdb.asia-southeast1.firebasedatabase.app",

    projectId:
        "wakutatu-shooting",

    storageBucket:
        "wakutatu-shooting.firebasestorage.app",

    messagingSenderId:
        "720905273138",

    appId:
        "1:720905273138:web:df97327c6007b5cbc1612b"
};


// ==========================================================
// スマホ側と同じ部屋名
// ==========================================================

const ROOM_ID = "main";


// ==========================================================
// ゲーム設定
// ==========================================================

const GAME_TIME = 20;

const START_BALLOON_COUNT = 3;

const LAST_BALLOON_COUNT = 4;

const ADD_BALLOON_TIME = 10;

const GOLD_BALLOON_RATE = 0.1;

const BALLOON_WIDTH = 230;

const BALLOON_HEIGHT = 310;

const SCREEN_MARGIN = 25;

const TOP_MARGIN = 130;


// ==========================================================
// 風船の当たり判定
// ==========================================================

const HIT_CENTER_X = 0.5;

const HIT_CENTER_Y = 0.29;

const HIT_RADIUS_X = 0.25;

const HIT_RADIUS_Y = 0.28;


// ==========================================================
// ArUco設定
// ==========================================================

const DETECT_WIDTH = 640;

const DETECT_HEIGHT = 360;


/*
   照準が左右逆ならtrueに変更
*/

const MIRROR_AIM_X = false;


/*
   小さいほど滑らか、大きいほど反応が速い
*/

const AIM_SMOOTH = 0.22;


// ==========================================================
// HTML要素
// ==========================================================

const game =
    document.getElementById("game");

const video =
    document.getElementById("camera");

const detectCanvas =
    document.getElementById("detectCanvas");

const detectContext =
    detectCanvas.getContext(
        "2d",
        {
            willReadFrequently: true
        }
    );

const balloonArea =
    document.getElementById("balloonArea");

const scope =
    document.getElementById("scope");

const shotFlash =
    document.getElementById("shotFlash");

const timeText =
    document.getElementById("time");

const scoreText =
    document.getElementById("score");

const countdown =
    document.getElementById("countdown");

const instruction =
    document.getElementById("instruction");

const resultOverlay =
    document.getElementById("resultOverlay");

const message =
    document.getElementById("message");

const startButton =
    document.getElementById("startButton");

const cameraStatus =
    document.getElementById("cameraStatus");

const markerStatus =
    document.getElementById("markerStatus");

const firebaseStatus =
    document.getElementById("firebaseStatus");


// ==========================================================
// 必須要素の確認
// ==========================================================

const requiredElements = {
    game,
    video,
    detectCanvas,
    balloonArea,
    scope,
    shotFlash,
    timeText,
    scoreText,
    countdown,
    instruction,
    resultOverlay,
    message,
    startButton,
    cameraStatus,
    markerStatus,
    firebaseStatus
};

for (
    const [name, element]
    of Object.entries(requiredElements)
) {

    if (!element) {

        console.error(
            "HTML要素が見つかりません：",
            name
        );
    }
}


// ==========================================================
// 風船データ
// ==========================================================

const normalBalloons = [
    {
        image:
            "images/redballoon.png",

        points:
            1,

        type:
            "normal"
    },

    {
        image:
            "images/blueballoon.png",

        points:
            1,

        type:
            "normal"
    },

    {
        image:
            "images/yellowballoon.png",

        points:
            1,

        type:
            "normal"
    }
];


const goldBalloon = {
    image:
        "images/goldballoon.png",

    points:
        5,

    type:
        "gold"
};


// ==========================================================
// 効果音
// ==========================================================

const shotSound =
    new Audio("sound/shot.mp3");

const popSound =
    new Audio("sound/hit.mp3");

const clearSound =
    new Audio("sound/clear.mp3");

shotSound.volume =
    0.42;

popSound.volume =
    0.68;

clearSound.volume =
    0.72;


// ==========================================================
// ゲーム中に変化する値
// ==========================================================

let score = 0;

let time =
    GAME_TIME;

let playing =
    false;

let countdownRunning =
    false;

let gameTimer =
    null;

let extraBalloonAdded =
    false;

let balloonId =
    0;


// ==========================================================
// ArUco関連
// ==========================================================

let detector =
    null;

let cameraStarted =
    false;

let markerDetected =
    false;

let aimX =
    window.innerWidth / 2;

let aimY =
    window.innerHeight / 2;

let targetAimX =
    aimX;

let targetAimY =
    aimY;

let detectionFrame =
    0;


// ==========================================================
// Firebase関連
// ==========================================================

let database =
    null;

/*
   初回読み込み時に現在の発射番号を記憶します。
*/

let lastFireCounter =
    null;


// ==========================================================
// 効果音を再生
// ==========================================================

function playSound(sound) {

    const soundCopy =
        sound.cloneNode();

    soundCopy.volume =
        sound.volume;

    soundCopy.currentTime =
        0;

    soundCopy.play().catch(
        function (error) {

            console.warn(
                "効果音を再生できません：",
                error
            );
        }
    );
}


// ==========================================================
// Firebaseへ接続
// ==========================================================

async function connectFirebase() {

    try {

        firebaseStatus.textContent =
            "認証中";

        const app =
            initializeApp(
                firebaseConfig
            );

        const auth =
            getAuth(app);

        database =
            getDatabase(app);

        await signInAnonymously(
            auth
        );

        firebaseStatus.textContent =
            "受信準備中";

        console.log(
            "Firebase匿名認証成功"
        );

        listenForShots();

    } catch (error) {

        firebaseStatus.textContent =
            "接続エラー";

        console.error(
            "Firebase接続エラー：",
            error
        );
    }
}


// ==========================================================
// スマホの発射番号を監視
// ==========================================================

function listenForShots() {

    const fireCounterReference =
        ref(
            database,
            "rooms/" +
            ROOM_ID +
            "/fireCounter"
        );

    onValue(
        fireCounterReference,

        function (snapshot) {

            const currentCounter =
                Number(
                    snapshot.val()
                ) || 0;

            /*
               最初の読み込み時は、
               現在の番号を記録するだけです。
            */

            if (
                lastFireCounter ===
                null
            ) {

                lastFireCounter =
                    currentCounter;

                firebaseStatus.textContent =
                    "受信準備完了";

                console.log(
                    "発射受信準備完了：",
                    currentCounter
                );

                return;
            }

            /*
               数字が変わっていなければ無視
            */

            if (
                currentCounter ===
                lastFireCounter
            ) {
                return;
            }

            console.log(
                "スマホから発射を受信：",
                {
                    前回:
                        lastFireCounter,

                    今回:
                        currentCounter
                }
            );

            lastFireCounter =
                currentCounter;

            firebaseStatus.textContent =
                "発射受信！";

            /*
               現在のArUco照準位置へ発射
            */

            shootAt(
                aimX,
                aimY
            );

            setTimeout(
                function () {

                    firebaseStatus.textContent =
                        "受信準備完了";

                },
                350
            );
        },

        function (error) {

            firebaseStatus.textContent =
                "受信エラー";

            console.error(
                "Firebase受信エラー：",
                error
            );
        }
    );
}

// ==========================================================
// ArUcoマーカー検出
// ==========================================================

function updateAruco() {

    detectionFrame++;

    /*
        処理負荷を下げるため、
        2フレームに1回だけ検出します。
    */

    if (
        detectionFrame % 2 === 0 &&
        video.readyState >=
        video.HAVE_CURRENT_DATA &&
        detector
    ) {

        /*
            カメラ映像を検出用Canvasへ描画します。
        */

        detectContext.drawImage(
            video,
            0,
            0,
            detectCanvas.width,
            detectCanvas.height
        );

        try {

            const imageData =
                detectContext.getImageData(
                    0,
                    0,
                    detectCanvas.width,
                    detectCanvas.height
                );

            const markers =
                detector.detect(
                    imageData
                );

            if (
                markers &&
                markers.length > 0
            ) {

                markerDetected =
                    true;

                markerStatus.textContent =
                    "検出中";

                scope.classList.add(
                    "detected"
                );

                const marker =
                    markers[0];

                let markerX = 0;
                let markerY = 0;

                for (
                    const corner
                    of marker.corners
                ) {

                    markerX +=
                        corner.x;

                    markerY +=
                        corner.y;
                }

                markerX /=
                    marker.corners.length;

                markerY /=
                    marker.corners.length;

                if (MIRROR_AIM_X) {

                    markerX =
                        detectCanvas.width -
                        markerX;
                }

                /*
                    検出用Canvas上の位置を、
                    ゲーム画面上の位置へ変換します。
                */

                targetAimX =
                    (
                        markerX /
                        detectCanvas.width
                    ) *
                    window.innerWidth;

                targetAimY =
                    (
                        markerY /
                        detectCanvas.height
                    ) *
                    window.innerHeight;

                console.log(
                    "ArUco検出成功",
                    {
                        id:
                            marker.id,

                        x:
                            Math.round(
                                markerX
                            ),

                        y:
                            Math.round(
                                markerY
                            )
                    }
                );

            } else {

                markerDetected =
                    false;

                markerStatus.textContent =
                    "未検出";

                scope.classList.remove(
                    "detected"
                );
            }

        } catch (error) {

            console.warn(
                "ArUco検出エラー：",
                error
            );
        }
    }

    /*
        照準をなめらかに移動
    */

    aimX +=
        (
            targetAimX -
            aimX
        ) *
        AIM_SMOOTH;

    aimY +=
        (
            targetAimY -
            aimY
        ) *
        AIM_SMOOTH;

    updateScopePosition();

    requestAnimationFrame(
        updateAruco
    );
}


// ==========================================================
// 照準位置を更新
// ==========================================================

function updateScopePosition() {

    scope.style.left =
        aimX + "px";

    scope.style.top =
        aimY + "px";
}


// ==========================================================
// ランダムな風船を選ぶ
// ==========================================================

function getRandomBalloonData() {

    if (
        Math.random() <
        GOLD_BALLOON_RATE
    ) {

        console.log(
            "ゴールド風船が出現"
        );

        return goldBalloon;
    }

    const randomIndex =
        Math.floor(
            Math.random() *
            normalBalloons.length
        );

    return normalBalloons[
        randomIndex
    ];
}


// ==========================================================
// 風船情報を設定
// ==========================================================

function applyBalloonData(
    balloon,
    balloonData
) {

    balloon.classList.remove(
        "gold"
    );

    balloon.src =
        balloonData.image;

    balloon.dataset.points =
        balloonData.points;

    balloon.dataset.type =
        balloonData.type;

    if (
        balloonData.type ===
        "gold"
    ) {

        balloon.classList.add(
            "gold"
        );
    }
}


// ==========================================================
// 風船を1個作る
// ==========================================================

function createBalloon() {

    const balloon =
        document.createElement(
            "img"
        );

    balloon.classList.add(
        "balloon"
    );

    balloon.alt =
        "風船";

    balloon.draggable =
        false;

    balloonId++;

    balloon.dataset.number =
        balloonId;

    applyBalloonData(
        balloon,
        getRandomBalloonData()
    );

    balloon.addEventListener(
        "error",
        function () {

            console.error(
                "風船画像を読み込めません：",
                balloon.src
            );
        }
    );

    balloonArea.appendChild(
        balloon
    );

    moveBalloon(
        balloon
    );

    return balloon;
}


// ==========================================================
// 風船をランダムな場所へ移動
// ==========================================================

function moveBalloon(balloon) {

    const rect =
        balloon.getBoundingClientRect();

    const currentWidth =
        rect.width ||
        BALLOON_WIDTH;

    const currentHeight =
        rect.height ||
        BALLOON_HEIGHT;

    const maxX =
        Math.max(
            SCREEN_MARGIN,
            game.clientWidth -
            currentWidth -
            SCREEN_MARGIN
        );

    const maxY =
        Math.max(
            TOP_MARGIN,
            game.clientHeight -
            currentHeight -
            SCREEN_MARGIN
        );

    const randomX =
        SCREEN_MARGIN +
        Math.random() *
        Math.max(
            0,
            maxX -
            SCREEN_MARGIN
        );

    const randomY =
        TOP_MARGIN +
        Math.random() *
        Math.max(
            0,
            maxY -
            TOP_MARGIN
        );

    balloon.style.left =
        randomX + "px";

    balloon.style.top =
        randomY + "px";
}


// ==========================================================
// 指定された数まで風船を増やす
// ==========================================================

function setBalloonCount(
    targetCount
) {

    while (
        balloonArea.children.length <
        targetCount
    ) {

        createBalloon();
    }
}


// ==========================================================
// 風船をすべて削除
// ==========================================================

function removeAllBalloons() {

    balloonArea.innerHTML =
        "";
}


// ==========================================================
// 命中した風船を探す
// ==========================================================

function findHitBalloon(
    shotX,
    shotY
) {

    const balloons =
        Array.from(
            document.querySelectorAll(
                ".balloon"
            )
        );

    balloons.reverse();

    for (
        const balloon
        of balloons
    ) {

        if (
            balloon.classList.contains(
                "popping"
            )
        ) {
            continue;
        }

        const rect =
            balloon.getBoundingClientRect();

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

        const normalizedX =
            (
                shotX -
                centerX
            ) /
            radiusX;

        const normalizedY =
            (
                shotY -
                centerY
            ) /
            radiusY;

        const ellipseValue =
            normalizedX *
            normalizedX +
            normalizedY *
            normalizedY;

        if (
            ellipseValue <= 1
        ) {

            return balloon;
        }
    }

    return null;
}


// ==========================================================
// 指定した座標へ発射
// ==========================================================

function shootAt(
    shotX,
    shotY
) {

    console.log(
        "発射処理：",
        {
            x:
                Math.round(shotX),

            y:
                Math.round(shotY),

            playing,
            countdownRunning
        }
    );

    /*
       ゲーム開始後のみ射撃できます。
    */

    if (
        !playing ||
        countdownRunning
    ) {

        console.log(
            "ゲーム中ではないため発射しません"
        );

        return;
    }

    playSound(
        shotSound
    );

    playScopeAnimation();

    showShotFlash(
        shotX,
        shotY
    );

    const hitBalloon =
        findHitBalloon(
            shotX,
            shotY
        );

    if (hitBalloon) {

        handleHit(
            hitBalloon,
            shotX,
            shotY
        );
    }
}


// ==========================================================
// 照準の発射アニメーション
// ==========================================================

function playScopeAnimation() {

    scope.classList.remove(
        "shooting"
    );

    void scope.offsetWidth;

    scope.classList.add(
        "shooting"
    );

    setTimeout(
        function () {

            scope.classList.remove(
                "shooting"
            );

        },
        180
    );
}


// ==========================================================
// 発射位置を光らせる
// ==========================================================

function showShotFlash(
    x,
    y
) {

    shotFlash.style.left =
        x + "px";

    shotFlash.style.top =
        y + "px";

    shotFlash.classList.remove(
        "show"
    );

    void shotFlash.offsetWidth;

    shotFlash.classList.add(
        "show"
    );
}


// ==========================================================
// 命中処理
// ==========================================================

function handleHit(
    balloon,
    shotX,
    shotY
) {

    if (
        balloon.classList.contains(
            "popping"
        )
    ) {
        return;
    }

    const points =
        Number(
            balloon.dataset.points
        );

    const isGold =
        balloon.dataset.type ===
        "gold";

    playSound(
        popSound
    );

    score +=
        points;

    scoreText.textContent =
        score;

    playScoreBump();

    showScorePopup(
        shotX,
        shotY,
        points,
        isGold
    );

    createConfetti(
        shotX,
        shotY,
        isGold
    );

    balloon.classList.add(
        "popping"
    );

    setTimeout(
        function () {

            applyBalloonData(
                balloon,
                getRandomBalloonData()
            );

            moveBalloon(
                balloon
            );

            balloon.classList.remove(
                "popping"
            );

            balloon.style.opacity =
                "1";

        },
        500
    );
}


// ==========================================================
// スコアを弾ませる
// ==========================================================

function playScoreBump() {

    scoreText.classList.remove(
        "bump"
    );

    void scoreText.offsetWidth;

    scoreText.classList.add(
        "bump"
    );
}


// ==========================================================
// +1・+5表示
// ==========================================================

function showScorePopup(
    x,
    y,
    points,
    isGold
) {

    const popup =
        document.createElement(
            "div"
        );

    popup.classList.add(
        "score-popup"
    );

    if (isGold) {

        popup.classList.add(
            "gold"
        );
    }

    popup.textContent =
        "+" + points;

    popup.style.left =
        x + "px";

    popup.style.top =
        y + "px";

    game.appendChild(
        popup
    );

    setTimeout(
        function () {

            popup.remove();

        },
        850
    );
}


// ==========================================================
// 紙吹雪
// ==========================================================

function createConfetti(
    x,
    y,
    isGold
) {

    const confettiCount =
        isGold
            ? 30
            : 18;

    const normalColors = [
        "#ff3f3f",
        "#37a9ff",
        "#ffe144",
        "#ff8a2b",
        "#55d36b",
        "#ffffff"
    ];

    const goldColors = [
        "#ffd000",
        "#fff38a",
        "#ffffff",
        "#ffae00"
    ];

    const colors =
        isGold
            ? goldColors
            : normalColors;

    for (
        let index = 0;
        index < confettiCount;
        index++
    ) {

        const piece =
            document.createElement(
                "div"
            );

        piece.classList.add(
            "confetti"
        );

        const angle =
            Math.random() *
            Math.PI *
            2;

        const distance =
            75 +
            Math.random() *
            (
                isGold
                    ? 170
                    : 125
            );

        const moveX =
            Math.cos(angle) *
            distance;

        const moveY =
            Math.sin(angle) *
            distance +
            50;

        const duration =
            0.55 +
            Math.random() *
            0.45;

        const rotate =
            (
                180 +
                Math.random() *
                720
            ) *
            (
                Math.random() <
                0.5
                    ? -1
                    : 1
            );

        piece.style.left =
            x + "px";

        piece.style.top =
            y + "px";

        piece.style.background =
            colors[
                Math.floor(
                    Math.random() *
                    colors.length
                )
            ];

        piece.style.width =
            (
                6 +
                Math.random() *
                7
            ) +
            "px";

        piece.style.height =
            (
                9 +
                Math.random() *
                11
            ) +
            "px";

        piece.style.setProperty(
            "--move-x",
            moveX + "px"
        );

        piece.style.setProperty(
            "--move-y",
            moveY + "px"
        );

        piece.style.setProperty(
            "--rotate",
            rotate + "deg"
        );

        piece.style.setProperty(
            "--duration",
            duration + "s"
        );

        game.appendChild(
            piece
        );

        setTimeout(
            function () {

                piece.remove();

            },
            duration *
            1000 +
            100
        );
    }
}


// ==========================================================
// カウントダウン
// ==========================================================

function showCountdownText(
    text
) {

    return new Promise(
        function (resolve) {

            countdown.textContent =
                text;

            countdown.classList.remove(
                "show"
            );

            countdown.style.display =
                "block";

            void countdown.offsetWidth;

            countdown.classList.add(
                "show"
            );

            setTimeout(
                function () {

                    countdown.classList.remove(
                        "show"
                    );

                    countdown.style.display =
                        "none";

                    resolve();

                },
                760
            );
        }
    );
}


// ==========================================================
// ゲーム開始
// ==========================================================

async function startGame() {

    if (countdownRunning) {
        return;
    }

    clearInterval(
        gameTimer
    );

    score =
        0;

    time =
        GAME_TIME;

    playing =
        false;

    countdownRunning =
        true;

    extraBalloonAdded =
        false;

    balloonId =
        0;

    scoreText.textContent =
        score;

    timeText.textContent =
        time;

    timeText.classList.remove(
        "danger"
    );

    resultOverlay.style.display =
        "none";

    message.style.display =
        "none";

    startButton.style.display =
        "none";

    instruction.style.display =
        "none";

    removeAllBalloons();

    await showCountdownText(
        "3"
    );

    await showCountdownText(
        "2"
    );

    await showCountdownText(
        "1"
    );

    await showCountdownText(
        "スタート！"
    );

    setBalloonCount(
        START_BALLOON_COUNT
    );

    playing =
        true;

    countdownRunning =
        false;

    console.log(
        "ゲーム開始・発射可能"
    );

    gameTimer =
        setInterval(
            function () {

                time--;

                timeText.textContent =
                    time;

                if (
                    time <= 5
                ) {

                    timeText.classList.add(
                        "danger"
                    );
                }

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
                }

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
// ゲーム終了
// ==========================================================

function endGame() {

    playing =
        false;

    countdownRunning =
        false;

    clearInterval(
        gameTimer
    );

    removeAllBalloons();

    timeText.classList.remove(
        "danger"
    );

    playSound(
        clearSound
    );

    resultOverlay.style.display =
        "block";

    message.innerHTML =
        "タイムアップ！<br>" +
        "スコア<br>" +
        "<strong>" +
        score +
        "点</strong>";

    message.style.display =
        "block";

    startButton.textContent =
        "もう一度あそぶ";

    startButton.style.display =
        "block";
}


// ==========================================================
// スタートボタン
// ==========================================================

startButton.addEventListener(
    "click",
    function (event) {

        event.stopPropagation();

        startGame();
    }
);


// ==========================================================
// スペースキーでパソコン側の発射テスト
// マウスでは発射しません
// ==========================================================

window.addEventListener(
    "keydown",
    function (event) {

        if (
            event.code ===
            "Space"
        ) {

            event.preventDefault();

            shootAt(
                aimX,
                aimY
            );
        }
    }
);


// ==========================================================
// 画面サイズ変更
// ==========================================================

window.addEventListener(
    "resize",
    function () {

        if (!playing) {
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
// 初期化
// ==========================================================

function initializeGame() {

    removeAllBalloons();

    resultOverlay.style.display =
        "none";

    message.style.display =
        "none";

    countdown.style.display =
        "none";

    updateScopePosition();

    connectFirebase();

    startCamera();

    console.log(
        "ゲームの初期化完了"
    );
}


initializeGame();
