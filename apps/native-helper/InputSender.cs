using System.Runtime.InteropServices;

public static class InputSender
{
    private const ushort VK_CONTROL = 0x11;
    private const ushort VK_V = 0x56;
    private const uint INPUT_KEYBOARD = 1;
    private const uint KEYEVENTF_KEYUP = 0x0002;

    [StructLayout(LayoutKind.Sequential)]
    private struct INPUT
    {
        public uint type;
        public KEYBDINPUT ki;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct KEYBDINPUT
    {
        public ushort wVk;
        public ushort wScan;
        public uint dwFlags;
        public uint time;
        public IntPtr dwExtraInfo;
    }

    [DllImport("user32.dll", SetLastError = true)]
    private static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);

    public static JsonResult SendPaste()
    {
        var inputs = new[]
        {
            KeyDown(VK_CONTROL),
            KeyDown(VK_V),
            KeyUp(VK_V),
            KeyUp(VK_CONTROL)
        };
        var sent = SendInput((uint)inputs.Length, inputs, Marshal.SizeOf<INPUT>());
        return sent == inputs.Length
            ? new JsonResult(true, "sendinput-ctrl-v")
            : new JsonResult(false, ErrorCode: "SENDINPUT_FAILED", Message: $"Sent {sent} of {inputs.Length} inputs.");
    }

    private static INPUT KeyDown(ushort key) => new()
    {
        type = INPUT_KEYBOARD,
        ki = new KEYBDINPUT { wVk = key }
    };

    private static INPUT KeyUp(ushort key) => new()
    {
        type = INPUT_KEYBOARD,
        ki = new KEYBDINPUT { wVk = key, dwFlags = KEYEVENTF_KEYUP }
    };
}
