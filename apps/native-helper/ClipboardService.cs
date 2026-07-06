using System.Windows.Forms;

public static class ClipboardService
{
    public static JsonResult WriteText(string text)
    {
        try
        {
            Clipboard.SetText(text, TextDataFormat.UnicodeText);
            return new JsonResult(true, "clipboard-write");
        }
        catch (Exception ex)
        {
            return new JsonResult(false, ErrorCode: "CLIPBOARD_WRITE_FAILED", Message: ex.Message);
        }
    }
}
