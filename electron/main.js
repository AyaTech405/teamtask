const { app, BrowserWindow, shell, dialog, Menu, ipcMain } = require('electron')
const { spawn, spawnSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const isDev = process.env.NODE_ENV === 'development'
const ROOT = path.join(__dirname, '..')
const PHP_PORT = 8000
const PHP_EXECUTABLE = 'C:\\Users\\lenovo\\.pvm\\versions\\php-8.2.31-Win32-vs16-x64\\php.exe'

let mainWindow = null
let phpProcess = null

function getDatabasePaths() {
  const dbDir = isDev
    ? path.join(ROOT, 'database')
    : path.join(app.getPath('userData'), 'database')

  return {
    dbDir,
    dbPath: path.join(dbDir, 'teamtask.db'),
  }
}

function initDatabase() {
  const { dbDir, dbPath } = getDatabasePaths()
  const sqlPath = path.join(ROOT, 'backend', 'database.sql')

  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })

  console.log('[TeamTask] Checking database schema...')

  const initPhp = `<?php
if (!in_array('sqlite', PDO::getAvailableDrivers(), true)) {
  fwrite(STDERR, "SQLite PDO driver is missing. Enable extension=pdo_sqlite in php.ini.");
  exit(1);
}
$dbPath = '${dbPath.replace(/\\/g, '/')}';
$sqlPath = '${sqlPath.replace(/\\/g, '/')}';
$pdo = new PDO('sqlite:' . $dbPath);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->exec('PRAGMA foreign_keys = ON');
$pdo->exec('PRAGMA busy_timeout = 5000');
$sql = file_get_contents($sqlPath);
if ($sql === false) {
  fwrite(STDERR, "Schema not found: " . $sqlPath);
  exit(1);
}
$pdo->exec($sql);
echo "OK";
`
  const tmpPath = path.join(dbDir, '_init.php')
  fs.writeFileSync(tmpPath, initPhp)

  const result = spawnSync(PHP_EXECUTABLE, [tmpPath], { encoding: 'utf8' })
  try { fs.unlinkSync(tmpPath) } catch {}

  if (result.error) {
    dialog.showErrorBox(
      'PHP required',
      'TeamTask requires PHP 8.0+.\n\nInstall PHP, add it to your PATH, then restart the app.'
    )
    app.quit()
    return false
  }

  if (result.status !== 0) {
    dialog.showErrorBox(
      'Database error',
      `TeamTask could not initialize its database.\n\n${result.stderr || result.stdout || 'Unknown error'}`
    )
    app.quit()
    return false
  }

  console.log('[TeamTask] Database ready.')
  return true
}

function startPHP() {
  return new Promise((resolve) => {
    const backendPath = path.join(ROOT, 'backend')
    const { dbPath } = getDatabasePaths()

    phpProcess = spawn(PHP_EXECUTABLE, ['-S', `127.0.0.1:${PHP_PORT}`, '-t', backendPath], {
      cwd: backendPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, TEAMTASK_DB_PATH: dbPath },
    })

    phpProcess.stderr.on('data', (data) => {
      const msg = data.toString()
      if (msg.includes('started') || msg.includes('Development Server')) {
        console.log(`[PHP] http://127.0.0.1:${PHP_PORT}`)
        resolve()
      }
    })

    phpProcess.on('error', (error) => {
      console.error('[PHP] Failed to start:', error)
      resolve()
    })

    setTimeout(resolve, 3000)
  })
}

function registerIpcHandlers() {
  ipcMain.handle('get-version', () => app.getVersion())

  ipcMain.handle('open-file', async (_event, opts = {}) => {
    const result = await dialog.showOpenDialog(mainWindow, opts)
    return result.canceled ? null : result.filePaths
  })

  ipcMain.handle('save-file', async (_event, opts = {}) => {
    const result = await dialog.showSaveDialog(mainWindow, opts)
    return result.canceled ? null : result.filePath
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#0F1117',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(ROOT, 'dist', 'index.html'))
  }

  mainWindow.once('ready-to-show', () => mainWindow.show())

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    // Local windows (e.g. window.open('') used by the PDF export print
    // preview) are allowed to open as a normal child window.
    return { action: 'allow' }
  })

  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'TeamTask', submenu: [
      { role: 'about', label: 'About' },
      { type: 'separator' },
      { role: 'quit', label: 'Quit' },
    ] },
    { label: 'View', submenu: [
      { role: 'reload', label: 'Reload' },
      { role: 'toggleDevTools', label: 'DevTools' },
      { type: 'separator' },
      { role: 'togglefullscreen', label: 'Full screen' },
    ] },
  ]))

  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(async () => {
  registerIpcHandlers()
  if (!initDatabase()) return
  await startPHP()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  if (phpProcess && !phpProcess.killed) phpProcess.kill('SIGTERM')
})
