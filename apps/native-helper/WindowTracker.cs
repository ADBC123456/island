using System.Runtime.InteropServices;
using System.Text;

public static class WindowTracker
{
    private static readonly string StateFile = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
        "VariableIsland",
        "active-window.txt"
    );

    [DllImport("user32.dll")]
    private static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    private static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

    public static JsonResult Remember()
    {
        Directory.CreateDirectory(Path.GetDirectoryName(StateFile)!);
        var handle = GetForegroundWindow();
        File.WriteAllText(StateFile, handle.ToInt64().ToString());
        return new JsonResult(true, "remember-window", GetWindowTitle(handle));
    }

    public static JsonResult Restore()
    {
        if (!File.Exists(StateFile))
        {
            return new JsonResult(false, ErrorCode: "NO_REMEMBERED_WINDOW", Message: "No remembered foreground window.");
        }

        var raw = File.ReadAllText(StateFile).Trim();
        if (!long.TryParse(raw, out var value) || value == 0)
        {
            return new JsonResult(false, ErrorCode: "BAD_WINDOW_HANDLE", Message: "Remembered window handle is invalid.");
        }

        var handle = new IntPtr(value);
        var ok = SetForegroundWindow(handle);
        return ok
            ? new JsonResult(true, "restore-window", GetWindowTitle(handle))
            : new JsonResult(false, ErrorCode: "RESTORE_WINDOW_FAILED", Message: "Failed to restore foreground window.");
    }

    private static string GetWindowTitle(IntPtr handle)
    {
        var builder = new StringBuilder(256);
        GetWindowText(handle, builder, builder.Capacity);
        return builder.ToString();
    }
}
