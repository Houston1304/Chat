import Cookies from "/node_modules/js-cookie/dist/js.cookie.mjs";

const chatWindow = document.querySelector(".chatWindow");
const URL = "https://edu.strada.one/api/user";
const MESSAGE_URL = "https://edu.strada.one/api/messages/";
const backButton = document.getElementById("backButton");
const RESULT = [];

const FORM = {
  INPUT_FORM: document.querySelector(".inputForm"),
  CLONE_TEMPLATE: document.querySelector(".myMessageTemplate"),
};

const OPTION = {
  OPTION_POP_UP: document.getElementById("optionPopUp"),
  CLOSE_OPTION: document.getElementById("closeOption"),
  OPTION_BUTTON: document.getElementById("optionsButton"),
  CONFIRM_NAME: document.getElementById("confirmName"),
};

const EMAIL = {
  EMAIL_POPUP: document.getElementById("loginPopUp"),
  CONFIRM_EMAIL: document.getElementById("confirmEmail"),
  EMAIL_INPUT: document.querySelector(".emailInput"),
};

const CODE = {
  CODE_POPUP: document.getElementById("codePopUp"),
  CONFIRM_CODE: document.getElementById("confirmCode"),
};

const MESSAGE = {
  SOMEONE_TEMPLATE: document.querySelector(".someoneMessageTemplate"),
};

const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

function addNewlines(str) {
  let result = "";
  while (str.length > 0) {
    result += str.substring(0, 13) + "\n";
    str = str.substring(13);
  }
  return result;
}

let tokenValue;

Cookies.get("token")
  ? (tokenValue = Cookies.get("token"))
  : (tokenValue = document.querySelector(".codeInput").value);
const socket = new WebSocket(`wss://edu.strada.one/websockets?${tokenValue}`);

document.addEventListener("DOMContentLoaded", () => {
  if (!Cookies.get("token")) {
    OPTION.OPTION_POP_UP.style.display = "block";
    OPTION.CLOSE_OPTION.style.display = "none";
  } else {
    OPTION.OPTION_POP_UP.style.display = "none";

    someOneMessage();

    setTimeout(() => {
      chatWindow.scrollTo(0, chatWindow.scrollHeight);
    }, 800);
  }
});

FORM.INPUT_FORM.addEventListener("submit", (event) => {
  event.preventDefault();

  const date = new Date();

  const textInput = document.getElementById("messageInput").value;

  if (textInput === "") {
    return;
  }

  const chatMessage = FORM.CLONE_TEMPLATE.content.cloneNode(true);
  chatMessage.getElementById("myMessageText").textContent =
    addNewlines(textInput);
  chatMessage.getElementById(
    "myMessageTime"
  ).textContent = `${date.getHours()}:${
    (date.getMinutes() < 10 ? "0" : "") + date.getMinutes()
  }`;

  socket.send(JSON.stringify({ text: `${textInput}` }));

  chatWindow.append(chatMessage);
  document.getElementById("messageInput").value = "";
  chatWindow.scrollTo(0, chatWindow.scrollHeight);
});

let start = 0;
const step = 20;

async function someOneMessage() {
  const { messages } = await getStory();

  let finish = start + step;

  for (let i = 0; i < messages.length; i++) {
    RESULT.push(messages[i]);
  }

  RESULT.slice(start, finish).map((obj) => {
    const time = new Date(obj.createdAt);

    if (obj.user.email == "kolya_nikolaev2001@mail.ru") {
      const chatMessage = FORM.CLONE_TEMPLATE.content.cloneNode(true);

      chatMessage.getElementById("myMessageText").textContent = addNewlines(
        obj.text
      );

      chatMessage.getElementById(
        "myMessageTime"
      ).textContent = `${time.getHours()}:${
        (time.getMinutes() < 10 ? "0" : "") + time.getMinutes()
      }`;

      chatWindow.prepend(chatMessage);
    } else {
      const someoneChatMessage =
        MESSAGE.SOMEONE_TEMPLATE.content.cloneNode(true);

      someoneChatMessage.getElementById("someoneMessageText").textContent =
        addNewlines(`${obj.user.name}: \r\n ${obj.text}`);

      someoneChatMessage.getElementById(
        "messageTime"
      ).textContent = `${time.getHours()}:${
        (time.getMinutes() < 10 ? "0" : "") + time.getMinutes()
      }`;

      chatWindow.prepend(someoneChatMessage);
    }
  });
  if (finish == messages.length) {
    const messageLoaded = document.createElement("span");
    messageLoaded.textContent = "Все сообщения загружены";
    messageLoaded.className = "messageLoaded";
    chatWindow.prepend(messageLoaded);
    chatWindow.removeEventListener("scroll", scrollMessages);
  } else {
    start += 20;
    return start;
  }
}

OPTION.OPTION_BUTTON.addEventListener("click", () => {
  OPTION.OPTION_POP_UP.style.display = "block";
});

OPTION.CLOSE_OPTION.addEventListener("click", () => {
  OPTION.OPTION_POP_UP.style.display = "none";
});

OPTION.CONFIRM_NAME.addEventListener("click", () => {
  OPTION.OPTION_POP_UP.style.display = "none";
  OPTION.CLOSE_OPTION.style.display = "block";
  EMAIL.EMAIL_POPUP.style.display = "block";
});

EMAIL.CONFIRM_EMAIL.addEventListener("click", async function (event) {
  event.preventDefault();
  if (!EMAIL.EMAIL_INPUT.value || !validateEmail(EMAIL.EMAIL_INPUT.value))
    return alert("Корректно введите адрес почты");

  EMAIL.EMAIL_POPUP.style.display = "none";
  CODE.CODE_POPUP.style.display = "block";

  const body = {
    email: EMAIL.EMAIL_INPUT.value,
  };
  try {
    let response = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw Error(response.statusText);
    } else {
      console.log(response);
    }
    if (!response.ok) {
      alert("Ошибка");
      throw Error(response.statusText);
    } else {
      console.log(response);
    }
  } catch {}
});

CODE.CONFIRM_CODE.addEventListener("click", function (event) {
  event.preventDefault();
  const token = document.querySelector(".codeInput").value;
  if (!token) return;
  Cookies.set("token", token, { expires: 1 });

  codeFetch();
  someOneMessage();

  location.reload();

  setTimeout(() => {
    chatWindow.scrollTo(0, chatWindow.scrollHeight);
  }, 800);

  CODE.CODE_POPUP.style.display = "none";
});

async function codeFetch() {
  const newName = document.querySelector(".nameInput").value;
  try {
    let response = await fetch(URL, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        Authorization: `Bearer ${tokenValue}`,
      },
      body: JSON.stringify({ name: newName }),
    });
    if (!response.ok) {
      alert("Ошибка");
      throw Error(response.statusText);
    } else {
      console.log(response);
    }
  } catch {}
}

async function getStory() {
  try {
    let response = await fetch(MESSAGE_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokenValue}`,
      },
    });
    if (!response.ok) {
      alert("Ошибка");
      throw Error(response.statusText);
    } else {
      console.log(response);
    }
    return response.json();
  } catch {}
}

chatWindow.addEventListener("scroll", scrollMessages);

function scrollMessages() {
  if (chatWindow.scrollTop == 0) {
    someOneMessage();
  }
}

backButton.addEventListener("click", () => {
  Cookies.set("token", tokenValue, { expires: 0 });
  OPTION.OPTION_POP_UP.style.display = "block";
});

socket.onmessage = function (event) {
  console.log(event.data);
  const obj = JSON.parse(event.data);

  const time = new Date(obj.createdAt);
  const someoneChatMessage = MESSAGE.SOMEONE_TEMPLATE.content.cloneNode(true);
  if (obj.user.email != "kolya_nikolaev2001@mail.ru") {
    someoneChatMessage.getElementById("someoneMessageText").textContent =
      addNewlines(`${obj.user.name}: \r\n ${obj.text}`);

    someoneChatMessage.getElementById(
      "messageTime"
    ).textContent = `${time.getHours()}:${
      (time.getMinutes() < 10 ? "0" : "") + time.getMinutes()
    }`;

    chatWindow.append(someoneChatMessage);
    chatWindow.scrollTo(0, chatWindow.scrollHeight);
  }
};

socket.onclose = function () {
  alert("Соединение закрыто");
};
