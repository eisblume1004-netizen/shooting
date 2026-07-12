// ==========================================================
// スマホ用発射コントローラー
//
// ボタンを押すたびにFirebase上の
// fireCounterを1増やします。
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
    runTransaction
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
// パソコン側と同じ部屋名
// ==========================================================

const ROOM_ID =
    "main";


// ==========================================================
// HTML要素
// ==========================================================

const fireButton =
    document.getElementById(
        "fireButton"
    );

const statusText =
    document.getElementById(
        "status"
    );


// ==========================================================
// Firebase関連
// ==========================================================

let database =
    null;

let connected =
    false;

let sending =
    false;


// ==========================================================
// Firebaseへ接続
// ==========================================================

async function connectFirebase() {

    try {

        statusText.textContent =
            "認証中…";

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

        connected =
            true;

        fireButton.disabled =
            false;

        statusText.textContent =
            "接続済み";

        statusText.classList.remove(
            "error"
        );

        statusText.classList.add(
            "connected"
        );

        console.log(
            "スマホ側Firebase接続成功"
        );

    } catch (error) {

        connected =
            false;

        fireButton.disabled =
            true;

        statusText.textContent =
            "接続できません";

        statusText.classList.remove(
            "connected"
        );

        statusText.classList.add(
            "error"
        );

        console.error(
            "Firebase接続エラー：",
            error
        );
    }
}


// ==========================================================
// 発射情報を送信
// ==========================================================

async function sendShot() {

    if (
        !connected ||
        !database ||
        sending
    ) {

        console.warn(
            "発射できない状態です",
            {
                connected,
                database:
                    Boolean(database),
                sending
            }
        );

        return;
    }

    sending =
        true;

    fireButton.classList.add(
        "pressed"
    );

    if (
        "vibrate"
        in navigator
    ) {

        navigator.vibrate(
            35
        );
    }

    try {

        const counterReference =
            ref(
                database,
                "rooms/" +
                ROOM_ID +
                "/fireCounter"
            );

        /*
           現在の数字に1を足します。

           0 → 1 → 2 → 3
        */

        const result =
            await runTransaction(
                counterReference,

                function (currentValue) {

                    const currentNumber =
                        Number(
                            currentValue
                        ) || 0;

                    return (
                        currentNumber +
                        1
                    );
                }
            );

        if (
            !result.committed
        ) {

            throw new Error(
                "発射情報を保存できませんでした"
            );
        }

        const newCounter =
            result.snapshot.val();

        statusText.textContent =
            "発射！";

        console.log(
            "発射送信成功：",
            newCounter
        );

        setTimeout(
            function () {

                if (connected) {

                    statusText.textContent =
                        "接続済み";
                }

            },
            300
        );

    } catch (error) {

        statusText.textContent =
            "送信エラー";

        statusText.classList.remove(
            "connected"
        );

        statusText.classList.add(
            "error"
        );

        console.error(
            "発射送信エラー：",
            error
        );

    } finally {

        setTimeout(
            function () {

                sending =
                    false;

                fireButton.classList.remove(
                    "pressed"
                );

            },
            120
        );
    }
}


// ==========================================================
// ボタン操作
// ==========================================================

fireButton.addEventListener(
    "pointerdown",
    function (event) {

        event.preventDefault();

        sendShot();
    }
);


// ==========================================================
// スペースキーでもテスト可能
// ==========================================================

window.addEventListener(
    "keydown",
    function (event) {

        if (
            event.code ===
            "Space"
        ) {

            event.preventDefault();

            sendShot();
        }
    }
);


// ==========================================================
// 初期化
// ==========================================================

connectFirebase();
