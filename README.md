Goal: Set up a jupyterhub server for the ArgLab Writing Observer team so that users can login to a jupyterhub server and execute code on data that they cannot see or have access to.

one terminal: jupyter labextension link . (run in cell_execution_hasher) --> jlpm run build --> jupyter labextension watch
other terminal: activate venv (source myenv/bin/activate) --> jlpm run build --> jupyter lab --autoreload

Resources:
https://github.com/jupyterlab/extension-examples/tree/main/hello-world
https://github.com/jupyter/nbdime

How to develop extension:
# clone examples repository

- Got custom jupyterlab extension to activate

### **B. Install JupyterLab Extension Tools**
(after pip install cookiecutter {it helps create extensions with a standardized structure})
2. **Clone the JupyterLab Extension Repository (For Reference and Examples)**

   It's beneficial to explore existing extensions to understand best practices.

   ```bash
   git clone https://github.com/jupyterlab/jupyterlab.git
   cd jupyterlab
   ```

---

## **3. Bootstrapping a New JupyterLab Extension**

Using the **JupyterLab Extension Cookiecutter** is the most straightforward way to create a new extension.

### **A. Generate a New Extension Scaffold**

1. **Run the Cookiecutter Template**

   ```bash
   cookiecutter https://github.com/jupyterlab/extension-cookiecutter-ts
   ```

3. **Navigate to the Generated Extension Directory**

   ```bash
   cd code-execution-logger
   ```
https://github.com/Willgunter/writing-observer
## **4. Developing Your Extension**

### **A. Implementing Code Execution Tracking**

To track when a user executes a cell and log changes, follow these steps:

1. **Modify `src/index.ts`**

   Here's a basic implementation outline:

   ```typescript
   import {
     JupyterFrontEnd,
     JupyterFrontEndPlugin
   } from '@jupyterlab/application';

   import {
     INotebookTracker,
     NotebookPanel
   } from '@jupyterlab/notebook';

   import { IDisposable } from '@lumino/disposable';

   const extension: JupyterFrontEndPlugin<void> = {
     id: 'code-execution-logger',
     autoStart: true,
     requires: [INotebookTracker],
     activate: (app: JupyterFrontEnd, tracker: INotebookTracker) => {
       console.log('JupyterLab extension code-execution-logger is activated!');

       tracker.widgetAdded.connect((sender, notebookPanel: NotebookPanel) => {
         notebookPanel.sessionContext.ready.then(() => {
           const kernel = notebookPanel.sessionContext.session?.kernel;
           if (!kernel) {
             return;
           }

           // Listen to kernel messages
           kernel.anyMessage.connect((_, msg) => {
             if (msg.msg.header.msg_type === 'execute_reply') {
               const content = msg.msg.content;
               const executionCount = content.execution_count;
               const payload = content.payload;
               const user = app.serviceManager.sessions;
               
               // Log the execution details
               console.log(`Cell executed at count ${executionCount}:`, payload);
               
               // Optionally, send data to your server
               fetch('/myextension/log', {
                 method: 'POST',
                 headers: {'Content-Type': 'application/json'},
                 body: JSON.stringify({
                   execution_count: executionCount,
                   payload: payload,
                   timestamp: new Date().toISOString()
                 })
               })
               .then(response => response.json())
               .then(data => {
                 console.log('Server response:', data);
               })
               .catch(error => {
                 console.error('Error logging execution:', error);
               });
             }
           });
         });
       });
     }
   };

   export default extension;
   ```

   **Explanation:**

   - **Listening to Notebook Events:** Uses `INotebookTracker` to monitor when notebooks are opened.
   - **Kernel Message Handling:** Connects to `anyMessage` to intercept kernel messages, specifically `execute_reply` to log execution details.
   - **Logging:** Sends execution details to a server endpoint (`/myextension/log`). Ensure that this endpoint exists and is properly configured on your JupyterHub server (more on this later).

2. **Build and Watch for Changes**

   While developing, it's convenient to have a development server that rebuilds your extension on file changes.

   ```bash
   npm install
   npm build
   npm watch
   ```
3. **Test the Extension Locally**

   - **Run JupyterLab in Development Mode:**

     ```bash
     jupyter lab
     ```

## **5. Testing the Extension in JupyterLab Before Integrating with JupyterHub**

1. **Ensure Your Virtual Environment is Activated:**

   ```bash
   source jupyterhub-venv/bin/activate
   ```

2. **Navigate to Your Extension Directory:**

   ```bash
   cd ~/jupyterhub/code-execution-logger  # Adjust path as necessary
   ```

3. **Build and Watch for Changes:**

   ```bash
   npm install
   npm build
   npm watch
   ```

4. **Launch JupyterLab:**

   ```bash
   jupyter lab
   ```

5. **Install the Extension Locally:**

   If the cookiecutter template hasn't set up automatic installation, you might need to install the extension in JupyterLab:

   ```bash
   jupyter labextension install .
   ```

   **Note:** Ensure that the development server (`npm watch`) is running during this process.

- **Server Communication Issues:**
  
  - Ensure that the server endpoint (`/myextension/log`) is reachable.

---
Integrating w/ JupyterHub
1. **Install the Extension in JupyterHub's Environment:**

   Since JupyterHub spawns single-user JupyterLab servers, ensure that your extension is installed in the same environment.

   ```bash
   # From your virtual environment
   jupyter labextension install /path/to/code-execution-logger
   ```

2. **Automate Extension Installation (Optional):**

   To streamline deployment, consider adding installation commands to a setup script or Dockerfile if you're using containers.

### **B. Setting Up Server-Side Logging Endpoint**

Your extension sends logs to `/myextension/log`. To handle these requests, you need to set up a corresponding **Jupyter Server Extension** or **JupyterHub Proxy** endpoint.

1. **Create a Server Extension:**

   Develop a Python server extension that listens for POST requests at `/myextension/log` and processes the incoming data.

   ```python
   # my_logging_extension.py

   from jupyter_server.base.handlers import APIHandler
   import tornado.web
   import json
   import hashlib

   class LogExecutionHandler(APIHandler):
       @tornado.web.authenticated
       def post(self):
           data = self.get_json_body()
           execution_count = data.get('execution_count')
           payload = data.get('payload')
           timestamp = data.get('timestamp')

           # Example: Hash the payload
           payload_str = json.dumps(payload)
           payload_hash = hashlib.sha256(payload_str.encode('utf-8')).hexdigest()

           # Log or store the information
           self.log.info(f"Execution Count: {execution_count}, Hash: {payload_hash}, Timestamp: {timestamp}")

           # Respond to the frontend
           self.finish(json.dumps({"status": "success"}))

   def load_jupyter_server_extension(server_app):
       web_app = server_app.web_app
       host_pattern = ".*$"
       route_pattern = "/myextension/log"
       handlers = [(route_pattern, LogExecutionHandler)]
       web_app.add_handlers(host_pattern, handlers)
       server_app.log.info("My Logging Extension loaded!")
   ```

2. **Integrate the Server Extension with JupyterHub:**

   - **Place `my_logging_extension.py` in your JupyterHub directory.**
   - **Update `jupyterhub_config.py` to load the server extension:**

     ```python
     # jupyterhub_config.py

     # ... existing configurations ...

     # Add server extensions
     c.ServerApp.jpserver_extensions = {
         "my_logging_extension": True
     }
     ```

   **Note:** Ensure that `my_logging_extension.py` is discoverable by Python (i.e., in the Python path).

3. **Restart JupyterHub:**

   After making these changes, restart JupyterHub to apply them.

   ```bash
   jupyterhub
   ```

4. **Test the Integration:**

   - Open JupyterLab via JupyterHub.
   - Execute cells.
   - Verify that the server logs show entries from your logging extension.

### **C. Handling Cross-Origin Requests (CORS)**

If your extension communicates across different origins, you might need to handle CORS policies. However, since the frontend and server are typically on the same origin in JupyterHub, this is usually not an issue.

### **A. Clone the JupyterLab Extension Repository**

```bash
git clone https://github.com/jupyterlab/jupyterlab.git
cd jupyterlab
```

### **B. Explore the `examples` Directory**

The repository contains an `examples` directory with sample extensions demonstrating various functionalities.

```bash
cd jupyterlab/examples
```
