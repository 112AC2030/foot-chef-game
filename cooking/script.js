/*********************** FIREBASE *************************/

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const statusRef = db.ref("smartFloor/status");

let smartFloorConnected = false;

statusRef.on("value", snap => {
    smartFloorConnected = snap.val();
    const icon = document.getElementById("connIcon");

    icon.textContent = smartFloorConnected ? "✅" : "❌";
});

/*********************** GAME DATA *************************/

const recipes = [
    {
        name: "Hotpot",
        image: "images/hotpot.png",
        ingredients: ["fishcake", "lettuce", "meat", "mushroom"]
    },
    {
        name: "Sandwich",
        image: "images/sandwich.png",
        ingredients: ["cheese", "beef", "mayo", "bread"]
    },
    {
        name: "Strawberry Cake",
        image: "images/strawberrycake.png",
        ingredients: ["strawberry", "milk", "flour", "eggs"]
    }
];

const wrongItems = ["chilli", "rat", "watermelon", "deathfish"];

let currentDishIndex = 0;
let collected = [];
let activeCells = [];
let timers = {};

let timer = 60;
let timerInterval;

/* ✅ SCORE */
let score = 0;

function updateScore(n) {
    score += n;
    document.getElementById("score").innerText = score;
}

const cells = document.querySelectorAll(".cell");

/*********************** START *************************/

document.getElementById("startBtn").onclick = () => {
    startGame();
};

function startGame() {
    document.getElementById("startScreen").classList.add("hidden");
    document.getElementById("gameScreen").classList.remove("hidden");

    currentDishIndex = 0;
    collected = [];

    score = 0;
    updateScore(0);

    document.getElementById("completed").innerHTML = "";

    loadDish();
    startSpawning();
    startTimer();
}

/*********************** LOAD DISH *************************/

function loadDish() {
    const dish = recipes[currentDishIndex];

    document.getElementById("dishName").innerText = dish.name;
    document.getElementById("dishImg").src = dish.image;

    const needDiv = document.getElementById("neededIngredients");
    needDiv.innerHTML = "";

    dish.ingredients.forEach(i => {
        let img = document.createElement("img");
        img.src = `images/${i}.png`;
        img.dataset.item = i;

        needDiv.appendChild(img);
    });

    collected = [];
}

/*********************** SPAWN *************************/

function randomWrong() {
    return wrongItems[Math.floor(Math.random() * wrongItems.length)];
}

function randomItem() {
    const dish = recipes[currentDishIndex];

    const needed = dish.ingredients;

    const remaining = needed.filter(i => !collected.includes(i));
    const already = needed.filter(i => collected.includes(i));

    let arr = [];

    // ✅ ưu tiên nguyên liệu chưa lấy (3 lần)
    remaining.forEach(i => {
        arr.push(i, i, i);
    });

    // ✅ nguyên liệu đã lấy (1 lần)
    already.forEach(i => {
        arr.push(i);
    });

    // ✅ thêm 2 nguyên liệu sai → vẫn thấy lỗi nhưng ít hơn đúng
    arr.push(randomWrong());
    arr.push(randomWrong());

    return arr[Math.floor(Math.random() * arr.length)];
}




function spawn(cell) {
    let item = randomItem();

    cell.innerHTML = "";
    let img = document.createElement("img");
    img.src = `images/${item}.png`;
    cell.appendChild(img);

    cell.dataset.item = item;

    if (!activeCells.includes(cell))
        activeCells.push(cell);

    if (timers[cell.dataset.index]) {
        clearTimeout(timers[cell.dataset.index]);
    }

    timers[cell.dataset.index] = setTimeout(() => {
        remove(cell);
    }, 3000);
}

function remove(cell) {
    cell.innerHTML = "";
    cell.dataset.item = "";
    cell.style.background = "rgba(255,255,255,0.7)";

    const idx = activeCells.indexOf(cell);
    if (idx !== -1) activeCells.splice(idx, 1);
}

function startSpawning() {
    setInterval(() => {
        if (activeCells.length < 3) {
            let free = [...cells].filter(c => !activeCells.includes(c));
            if (free.length === 0) return;

            const c = free[Math.floor(Math.random() * free.length)];
            spawn(c);
        }
    }, 800);
}

/*********************** CLICK *************************/

cells.forEach(c => {
    c.onclick = () => {
        const item = c.dataset.item;
        if (!item) return;

        const needed = recipes[currentDishIndex].ingredients;

        if (needed.includes(item) && !collected.includes(item)) {
            collected.push(item);

            // ✅ nền xanh cho đúng
            c.style.background = "#a8ffa8";

            // ✅ FIX: xóa ảnh để ô không bị giữ màu xanh + ảnh
            c.innerHTML = "";

            let img = document.querySelector(`#neededIngredients img[data-item="${item}"]`);
            if (img) img.classList.add("collected");

            updateScore(+10);
        } else {
            c.style.background = "#ff8a8a";
            updateScore(-20);
        }

        setTimeout(() => remove(c), 300);

        if (collected.length === needed.length) {
            completeDish();
        }
    };
});

/*********************** COMPLETE *************************/

function completeDish() {
    const dish = recipes[currentDishIndex];

    const img = document.createElement("img");
    img.src = dish.image;

    document.getElementById("completed").appendChild(img);

    updateScore(+30);

    currentDishIndex++;

    // ✅ chạy liên tục
    if (currentDishIndex >= recipes.length) {
        currentDishIndex = 0;
    }

    loadDish();
}

/*********************** TIMER *************************/

function startTimer() {
    timer = 20;

    timerInterval = setInterval(() => {
        timer--;
        document.getElementById("timer").innerText = timer;

        if (timer <= 0) {
    clearInterval(timerInterval);
    showEndScreen();   // ✅ chuyển sang UI mới
}

    }, 1000);

    function showEndScreen() {
    // Ẩn game
    document.getElementById("gameScreen").classList.add("hidden");

    // Hiển thị end screen
    document.getElementById("endScreen").classList.remove("hidden");

    // Hiển thị điểm
    document.getElementById("finalScore").innerText = "Score: " + score;

    // Lấy các món đã nấu
    const completedImgs = document.querySelectorAll("#completed img");

    const dishCount = {};

    completedImgs.forEach(img => {
        let name = img.src.split("/").pop().replace(".png", "");

        if (!dishCount[name]) dishCount[name] = 0;

        dishCount[name]++;
    });

    // Render lại danh sách món
    const box = document.getElementById("finalDishes");
    box.innerHTML = "";

    for (let name in dishCount) {
        const div = document.createElement("div");
        div.classList.add("item");

        const img = document.createElement("img");
        img.src = "images/" + name + ".png";

        const text = document.createElement("span");
        text.innerText = name + " × " + dishCount[name];

        div.appendChild(img);
        div.appendChild(text);

        box.appendChild(div);
    }
}
document.getElementById("playAgainBtn").onclick = () => {
    document.getElementById("endScreen").classList.add("hidden");
    document.getElementById("startScreen").classList.remove("hidden");

    score = 0;
    updateScore(0);
};


}
