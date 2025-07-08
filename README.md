# 🎨 OllyUI

> Your beautiful, powerful, and private desktop companion for local AI.

## Welcome to OllyUI!

Have you ever wanted to use powerful AI models like the ones you see online, but entirely on your own computer for maximum privacy and speed? That's what **Ollama** lets you do, and **OllyUI** is the perfect app to make that experience easy, beautiful, and fun.

OllyUI is a lightweight and complete desktop application designed to be the ultimate front-end for your local language models. It replaces the command line with a clean, feature-rich chat interface that feels intuitive and powerful.

Whether you're a developer prototyping ideas, a writer looking for a creative partner, a student doing research, or just someone curious about AI, OllyUI provides the tools you need in a simple, elegant package.

---

## ✨ Features That Matter

OllyUI is designed to be simple on the outside and powerful on the inside.

* **🗂️ Full Conversation Management:** Your chat history is automatically saved locally. You can easily rename, delete, and switch between different conversations.
* **🚀 Automatic Model Detection:** OllyUI automatically finds all of your installed Ollama models and lets you switch between them from the settings menu.
* **⚙️ Total Model Control:** Fine-tune your experience by adjusting advanced settings like the AI's creativity (temperature), response length (max tokens), and memory (history length). You can even provide a custom "System Prompt" to change the AI's personality!
* **✍️ Beautiful Code & Text:** The AI's responses are beautifully formatted with full Markdown support, including syntax highlighting for code blocks, making it easy to read and copy.
* **📎 Effortless File Attachments:** Have a document you want the AI to read? Just attach a `.pdf` or `.txt` file, and its contents will be included in your conversation.
* **🌍 True RTL Language Support:** OllyUI seamlessly handles right-to-left languages like Persian, Arabic, and Hebrew, ensuring correct text alignment in both your messages and the AI's responses.
* **🌗 Sleek Light & Dark Modes:** Automatically matches your system's theme, or you can toggle between them with a single click.
* **↔️ Smart Resizing Input:** The message box comfortably grows and shrinks as you type, giving you plenty of space for your thoughts.

---

## 🚀 Getting Started: Your 3-Step Guide

Getting OllyUI running is simple. Just follow these steps carefully, and you'll be chatting with your local AI in minutes.

### ✅ Step 1: Make Sure Ollama is Ready

Before you can use OllyUI, your computer needs to have the core Ollama software installed and at least one AI model downloaded.

1.  **Install Ollama:** If you haven't already, download and install Ollama from its official website. It's a standard installer, just like any other app.
    * **[Download Ollama Here](https://ollama.com/)**

2.  **Download an AI Model:** After installing Ollama, you need to download a model for it to run. Open your computer's command line tool (**Terminal** on macOS/Linux, **Command Prompt** on Windows) and run the following command:
    ```bash
    ollama run gemma
    ```
    This will download Google's "Gemma" model, a great starting choice. You can do this for any model you like (e.g., `ollama run llama3`). The first time you run this, you'll see a download progress bar. Once it's done, you'll be able to chat with the model in your terminal. You can then close this chat.

### 🔧 Step 2: Configure Ollama to Accept Connections from OllyUI

This is the most important technical step. For security, Ollama doesn't let other apps talk to it by default. We need to give OllyUI explicit permission.

**Why is this needed?** Think of it like a security guard. By default, the guard only lets you (the computer owner) talk to Ollama directly. We need to tell the guard that OllyUI is a trusted friend and is allowed to connect.

<details>
<summary><b>➡️ Click Here for Detailed Windows Instructions</b></summary>

On Windows, we will add a permanent "System Environment Variable".

1.  **Fully Close Ollama:** Find the Ollama icon in your system tray (the area by your clock), right-click it, and select **"Quit Ollama"**. This is very important.
2.  **Open Command Prompt as an Administrator:**
    * Click your **Start Menu** and type `cmd`.
    * You will see **"Command Prompt"**. Right-click on it and choose **"Run as administrator"**.
3.  **Run the Command:** Copy the entire command below, paste it into the black Command Prompt window, and press **Enter**.
    ```cmd
    setx OLLAMA_ORIGINS "*" /m
    ```
    You should see a message that says `SUCCESS: Specified value was saved.`
4.  **Restart Your Computer:** This is the easiest way to ensure the new setting is applied everywhere.
5.  After restarting, you can start Ollama again. It will now be ready for OllyUI.

</details>

<details>
<summary><b>➡️ Click Here for Detailed macOS & Linux Instructions</b></summary>

On macOS and Linux, we need to set an environment variable before starting the server.

**Option A: The Simple Way (For each session)**

Every time you want to use OllyUI, you'll first need to start the Ollama server with a special command.

1.  Open your **Terminal** application.
2.  Run the following command. This command both sets the permission and starts the server at the same time.
    ```bash
    export OLLAMA_ORIGINS="*" && ollama serve
    ```
3.  Keep this terminal window open while you use OllyUI. When you close the terminal, the server will stop.

**Option B: The Permanent Way (Set it and forget it)**

If you don't want to run the command above every time, you can add it to your shell's startup file.

1.  Open your **Terminal**.
2.  You need to edit either `.zshrc` (for modern macOS/Linux) or `.bash_profile` (for older systems). You can check which one to use by typing `echo $SHELL`.
3.  Open the file in a simple text editor. For example:
    ```bash
    nano ~/.zshrc
    ```
4.  Scroll to the very bottom of the file and add this new line:
    ```bash
    export OLLAMA_ORIGINS="*"
    ```
5.  Save the file (in `nano`, press `Ctrl+X`, then `Y`, then `Enter`).
6.  Close and reopen your terminal. Now, the permission is set automatically every time you start your computer. You can just run `ollama serve` normally.

</details>

---

### 💻 Step 3: Install and Launch OllyUI

You're on the final step!

1.  **Go to the Releases Page:** All official versions of OllyUI are hosted here.
    * **[Click here to go to the OllyUI Downloads Page](https://github.com/your-username/your-repo-name/releases)**
    *(Note: This link will be updated to the real one upon release!)*

2.  **Download the Correct File:** In the latest release section (usually at the top), find the file for your operating system.
    * **Windows:** Download the file ending in `.msi`. (e.g., `OllyUI_1.0.0_x64_en-US.msi`)
    * **macOS:** Download the file ending in `.dmg`. (e.g., `OllyUI_1.0.0_x64.dmg`)
    * **Linux:** Download the `.AppImage` or `.deb` file.

3.  **Install the App:** Find the downloaded file in your "Downloads" folder and double-click it. Follow the standard on-screen instructions. It will install just like any other app.

Once installed, find **OllyUI** in your applications list, launch it, and enjoy a much better way to chat with your local AI!

### 💡 Troubleshooting

* **"My models aren't showing up in the settings!"**
    * This is almost always because the configuration in **Step 2** was missed or didn't apply correctly. Please go back and carefully follow the instructions for your operating system, especially the part about restarting your computer or your terminal session.

---

### 📜 License

This project is licensed under the MIT License.

