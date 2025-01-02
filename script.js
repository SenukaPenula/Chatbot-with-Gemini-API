const typingForm = document.querySelector(".typing-form"); 
const chatList = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");
const deleteChat = document.querySelector("#delete-chat");

let userMessage = null;
let isResponseGenerating = false;


// Api config
const GEMINI_API_KEY = "AIzaSyAuoynCiROhm9qdvFsUS0mLQcgzUnQN7CI";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const loadLocalStorageData = () => {
    const savedChats = localStorage.getItem("savedChats");

    chatList.innerHTML = savedChats || "";

    document.body.classList.toggle("hide-header", savedChats);
    chatList.scrollTo(0, chatList.scrollHeight);
}

loadLocalStorageData();

// Create a new msg element and run it
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("msg", ...classes);
    div.innerHTML = content;
    return div;
}

const showTypingEffect = (text, textElement, incomingMessageDiv) => {
    const words = text.split(' ');
    let currentWorldIndex = 0;

    const typingIntervel = setInterval(() => {
        textElement.innerText += (currentWorldIndex === 0 ? '' : ' ') + words[currentWorldIndex++];
        incomingMessageDiv.querySelector(".icon").classList.add("hide");

        if (currentWorldIndex === words.length) {
            clearInterval(typingIntervel);
            isResponseGenerating = false;
            incomingMessageDiv.querySelector(".icon").classList.remove("hide");
            localStorage.setItem("savedChats", chatList.innerHTML);
            
        }
        chatList.scrollTo(0, chatList.scrollHeight);
    }, 75);
}


const generateAPIResponse = async (incomingMessageDiv) => {
    const textElement = incomingMessageDiv.querySelector(".text"); //Get text element

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts:[{ text: userMessage}]
                }]
            })
        });

        const data = await response.json();
        if(!response.ok) throw new Error (data.error.msg)


        // get api response text
        const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1');
        showTypingEffect(apiResponse, textElement, incomingMessageDiv );
    } catch (error) {
        isResponseGenerating = false;
        textElement.innerText = error.msg;
        textElement.classList.add(error);
    } finally {
        incomingMessageDiv.classList.remove("loading");
    }
    
}

// Show a loading animation while waiting for API response
const showLoadingAnimation = () => {
        const html = `<div class="msg-content">
                <img src="ai.svg" alt="Ai Image" class="avatar">
                <p class="text"></p>
                <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                </div>
            </div>
            <span onclick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;
    
    const incomingMessageDiv = createMessageElement(html, "incoming" , "loading");
    chatList.appendChild(incomingMessageDiv);

    chatList.scrollTo(0, chatList.scrollHeight);
    generateAPIResponse(incomingMessageDiv);

}

const copyMessage = (copyIcon) => {

    const messageText = copyIcon.parentElement.querySelector(".text").innerText;

    navigator.clipboard.writeText(messageText);
    copyIcon.innerText = "done" //show tick icon
    
    setTimeout(() => copyIcon.innerText = "content_copy", 1000) // revert icon after 1s
}

const handleOutgoingChat = () => {
    userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
    if (!userMessage || isResponseGenerating) return; //Exit if there is no msg

    isResponseGenerating = true;

    const html = `<div class="msg-content">
                  <img src="user.svg" alt="User Image" class="avatar">
                  <p class="text"></p>
                  </div>`;
    
    const outgoingMessageDiv = createMessageElement(html, "outgoing");
    outgoingMessageDiv.querySelector(".text").innerText = userMessage;
    chatList.appendChild(outgoingMessageDiv);

    typingForm.reset(); // Clear Input field
    chatList.scrollTo(0, chatList.scrollHeight);
    document.body.classList.add("hide-header");
    setTimeout(showLoadingAnimation, 500); // Show loading animation after delay
}


suggestions.forEach(suggestions => {
    suggestions.addEventListener("click", () => {
        userMessage = suggestions.querySelector(".text").innerText;
        handleOutgoingChat();
    });
});


deleteChat.addEventListener("click", () => {
    if (confirm("Are you sure you want to delete all chats?")) {
        localStorage.removeItem("savedChats");
        loadLocalStorageData();
    }
});


// Prevent Default from submission and handle outgoing chat
typingForm.addEventListener("submit", (e) => {
    e.preventDefault();

    handleOutgoingChat();
});

