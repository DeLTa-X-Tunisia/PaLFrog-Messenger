using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Windows.Forms;

namespace PaLFroG.Launcher;

public sealed class MainForm : Form
{
    private readonly Button _webButton;
    private readonly Button _electronButton;
    private readonly Button _stopButton;
    private readonly ListBox _logListBox;

    private Process? _webProcess;
    private Process? _electronProcess;

    public MainForm()
    {
        Text = "PaLFroG Launcher";
        StartPosition = FormStartPosition.CenterScreen;
        MinimumSize = new Size(520, 360);
        BackColor = Color.WhiteSmoke;

        var buttonsPanel = new FlowLayoutPanel
        {
            Dock = DockStyle.Top,
            Height = 80,
            FlowDirection = FlowDirection.LeftToRight,
            Padding = new Padding(16),
            WrapContents = false
        };

        _webButton = CreateActionButton("🌐 Lancer Web", OnLaunchWebClicked, Color.FromArgb(25, 135, 84));
        _electronButton = CreateActionButton("⚡ Lancer Electron", OnLaunchElectronClicked, Color.FromArgb(13, 110, 253));
        _stopButton = CreateActionButton("⛔ Arrêter", OnStopClicked, Color.FromArgb(220, 53, 69));

        buttonsPanel.Controls.Add(_webButton);
        buttonsPanel.Controls.Add(_electronButton);
        buttonsPanel.Controls.Add(_stopButton);

        _logListBox = new ListBox
        {
            Dock = DockStyle.Fill,
            Font = new Font(FontFamily.GenericMonospace, 10),
            IntegralHeight = false
        };

        Controls.Add(_logListBox);
        Controls.Add(buttonsPanel);

        FormClosing += (_, _) => StopProcesses();
        UpdateButtonStates();
    }

    private Button CreateActionButton(string text, EventHandler handler, Color backColor)
    {
        var button = new Button
        {
            Text = text,
            AutoSize = false,
            Width = 150,
            Height = 40,
            Margin = new Padding(0, 0, 12, 0),
            BackColor = backColor,
            ForeColor = Color.White,
            FlatStyle = FlatStyle.Flat,
            Font = new Font("Segoe UI", 10F, FontStyle.Bold, GraphicsUnit.Point)
        };

        button.FlatAppearance.BorderSize = 0;
        button.Click += handler;
        return button;
    }

    private void OnLaunchWebClicked(object? sender, EventArgs e)
    {
        StartProcess(ref _webProcess, "Web", GetFrontendDirectory(), "npm run dev");
    }

    private void OnLaunchElectronClicked(object? sender, EventArgs e)
    {
        StartProcess(ref _electronProcess, "Electron", GetElectronDirectory(), "npm run electron || npm run start");
    }

    private void OnStopClicked(object? sender, EventArgs e)
    {
        var hadAny = StopProcesses();
        var message = hadAny ? "Les processus ont été arrêtés." : "Aucun processus actif à arrêter.";
        MessageBox.Show(this, message, "PaLFroG Launcher", MessageBoxButtons.OK, MessageBoxIcon.Information);
    }

    private void StartProcess(ref Process? storage, string label, string workingDirectory, string command)
    {
        if (string.IsNullOrWhiteSpace(workingDirectory) || !Directory.Exists(workingDirectory))
        {
            AddLog($"[ERROR] {label} - dossier introuvable: {workingDirectory}");
            MessageBox.Show(this, $"Le dossier {workingDirectory} est introuvable.", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }

        if (storage != null && !storage.HasExited)
        {
            AddLog($"[INFO] {label} déjà lancé");
            return;
        }

        try
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = "cmd.exe",
                Arguments = $"/c {command}",
                WorkingDirectory = workingDirectory,
                UseShellExecute = false,
                CreateNoWindow = false
            };

            var launchedProcess = new Process
            {
                StartInfo = startInfo,
                EnableRaisingEvents = true
            };

            launchedProcess.Exited += (_, _) => OnProcessExited(label, launchedProcess);

            if (launchedProcess.Start())
            {
                storage = launchedProcess;
                AddLog($"[STARTED] {label}");
                UpdateButtonStates();
            }
            else
            {
                AddLog($"[ERROR] {label} - démarrage impossible");
            }
        }
        catch (Exception ex)
        {
            storage = null;
            AddLog($"[ERROR] {label} - {ex.Message}");
            MessageBox.Show(this, ex.Message, "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    private bool StopProcesses()
    {
        var stoppedAny = false;
        stoppedAny |= TryStopProcess(ref _webProcess, "Web");
        stoppedAny |= TryStopProcess(ref _electronProcess, "Electron");
        UpdateButtonStates();
        return stoppedAny;
    }

    private bool TryStopProcess(ref Process? process, string label)
    {
        if (process == null)
        {
            return false;
        }

        try
        {
            if (!process.HasExited)
            {
                process.Kill(true);
                process.WaitForExit(3000);
            }
            else
            {
                AddLog($"[STOPPED] {label}");
            }
        }
        catch (Exception ex)
        {
            AddLog($"[ERROR] {label} - {ex.Message}");
        }
        finally
        {
            process.Dispose();
            process = null;
        }

        return true;
    }

    private void OnProcessExited(string label, Process process)
    {
        if (InvokeRequired)
        {
            BeginInvoke(new Action(() => OnProcessExited(label, process)));
            return;
        }

        if (ReferenceEquals(process, _webProcess))
        {
            _webProcess = null;
        }

        if (ReferenceEquals(process, _electronProcess))
        {
            _electronProcess = null;
        }

        AddLog($"[STOPPED] {label}");
        UpdateButtonStates();
        process.Dispose();
    }

    private void UpdateButtonStates()
    {
        _webButton.Enabled = _webProcess == null || _webProcess.HasExited;
        _electronButton.Enabled = _electronProcess == null || _electronProcess.HasExited;
        _stopButton.Enabled = (_webProcess != null && !_webProcess.HasExited) || (_electronProcess != null && !_electronProcess.HasExited);
    }

    private void AddLog(string message)
    {
        if (InvokeRequired)
        {
            BeginInvoke(new Action(() => AddLog(message)));
            return;
        }

        _logListBox.Items.Insert(0, $"{DateTime.Now:HH:mm:ss} {message}");
    }

    private static string GetFrontendDirectory()
    {
        return Path.Combine(GetRepoRoot(), "apps", "frontend");
    }

    private static string GetElectronDirectory()
    {
        return Path.Combine(GetRepoRoot(), "apps", "electron");
    }

    private static string GetRepoRoot()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);

        while (directory != null)
        {
            var appsPath = Path.Combine(directory.FullName, "apps");
            if (Directory.Exists(appsPath))
            {
                return directory.FullName;
            }

            directory = directory.Parent;
        }

        return AppContext.BaseDirectory;
    }
}
