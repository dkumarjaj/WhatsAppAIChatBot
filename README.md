# 🤖 DevAI WhatsApp Bot

DevAI is a WhatsApp chatbot built with Node.js that integrates Google Gemini AI to provide intelligent responses for education, tech support, and CSC-related queries.

It supports **AI mode 🤖** and **Normal mode 🙂**, along with user session handling, language selection, and automatic reset after 24 hours.

---

## 🚀 Features

* 💬 WhatsApp chatbot using `whatsapp-web.js`
* 🧠 AI responses powered by Google Gemini API
* 🌐 Multi-language support (user-defined)
* 🔄 24-hour session expiry and auto-reset
* 🗂 User data persistence using JSON
* 🔐 Environment variable support using `.env`
* 🚫 Restricted responses (only education, CSC, and tech topics)

---

## 🛠️ Tech Stack

* Node.js
* whatsapp-web.js
* Google Generative AI (Gemini API)
* qrcode-terminal
* dotenv
* fs (File System)

---

## 📦 Installation

```bash
git clone https://github.com/your-username/devai-whatsapp-bot.git
cd devai-whatsapp-bot
npm install
```

---

## ⚙️ Setup

1. Create a `.env` file in the root directory:

```
GEMINI_API_KEY=your_api_key_here
```

2. Run the bot:

```bash
node index.js
```

3. Scan the QR code from WhatsApp.

---

## 📁 Project Structure

```
├── index.js        # Main bot logic
├── users.json      # Stores user sessions
├── .env            # API keys (not pushed to GitHub)
├── package.json
```

---

## 🧠 AI Behavior Rules

The bot only responds to:

* 📚 Education & study-related questions
* 💻 Coding & tech queries
* 🏢 CSC (Common Service Centre) topics

### ❗ Restrictions

* No personal conversations (e.g., "how are you?")
* No inappropriate or sexual content
* Out-of-scope queries return:

  ```
  ⚠️ I only answer Education, CSC, and Tech-related questions.
  ```

---

## 🔄 User Flow

1. User sends message → bot asks to choose mode
2. User selects:

   * `ai` → AI mode
   * `normal` → normal chat
3. AI mode:

   * asks for language 🌐
   * stores preference
   * starts AI conversation
4. Session auto-resets after **24 hours**

---

## 🧾 Example Commands

```
ai / devai        → Enable AI mode
normal / exit     → Disable AI mode
```

---

## ⚠️ Notes

* Chats may be monitored and stored for safety.
* Do not share sensitive or personal data.
* Keep `.env` file private.

---

## 📌 Future Improvements

* Database integration (MongoDB / Firebase)
* Admin dashboard
* Rate limiting
* Message analytics
* Voice message support

---

## 👨‍💻 Author

**Devendra (DevAI Creator)**
"Building smart assistants for real-world use 🚀"

---

## 📜 License

This project is licensed under the MIT License.
