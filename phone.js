// ==========================================================
// スマホ用発射コントローラー
// Firebaseを通してパソコンへ発射情報を送ります
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
    set,
    serverTimestamp
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

const ROOM_ID = "main";


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
// Firebase
// ==========================================================

let database = null;

let connected = false;

let sending = false;


// ==========================================================
// Firebaseへ接続
// ==========================================================

async function connectFirebase() {

    try {

        const app =
            initializeApp(
                firebaseConfig
            );

        const auth =
            getAuth(
                app
            );

        database =
            getDatabase(
                app
            );

        statusText.textContent =
            "認証中…";

        await signInAnonymously(
            auth
        );

        connected =
            true;

        fireButton.disabled =
            false;

        statusText.textContent =
            "接続済み";

        statusText.classList.add(
            "connected"
        );

        console.log(
            "Firebase接続成功"
        );

    } catch (error) {

        connected =
            false;

        fireButton.disabled =
            true;

        statusText.textContent =
            "接続できません";

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
// 発射情報をFirebaseへ送る
// ==========================================================

async function sendShot() {

    if (
        !connected ||
        !database ||
        sending
    ) {
        return;
    }

    sending =
        true;

    fireButton.classList.add(
        "pressed"
    );

    /*
       スマホが対応していれば、
       短く振動させます。
    */

    if (
        "vibrate"
        in navigator
    ) {

        navigator.vibrate(
            35
        );
    }

    try {

        const shotReference =
            ref(
                database,
                "rooms/" +
                ROOM_ID +
                "/shot"
            );

        /*
           毎回異なるIDを書き込みます。
           パソコン側はIDが変化したことを見て発射します。
        */

        const shotId =
            (
                crypto.randomUUID
                    ? crypto.randomUUID()
                    : Date.now() +
                      "-" +
                      Math.random()
            );

        await set(
            shotReference,
            {
                id:
                    shotId,

                time:
                    serverTimestamp()
            }
        );

        statusText.textContent =
            "発射！";

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
            100
        );
    }
}


// ==========================================================
// タッチ操作
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