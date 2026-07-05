[STAThread]
static int Run(string[] args)
{
    JsonResult result;
    try
    {
        if (args.Length == 0)
        {
            result = new JsonResult(false, ErrorCode: "NO_COMMAND", Message: "Command is required.");
        }
        else if (args[0] == "remember")
        {
            result = WindowTracker.Remember();
        }
        else if (args[0] == "insert" && args.Length >= 2)
        {
            var text = args[1];
            var clipboard = ClipboardService.WriteText(text);
            if (!clipboard.Success)
            {
                result = clipboard;
            }
            else
            {
                Thread.Sleep(80);
                var restore = WindowTracker.Restore();
                if (!restore.Success)
                {
                    result = restore;
                }
                else
                {
                    Thread.Sleep(80);
                    result = InputSender.SendPaste();
                }
            }
        }
        else
        {
            result = new JsonResult(false, ErrorCode: "UNKNOWN_COMMAND", Message: string.Join(' ', args));
        }
    }
    catch (Exception ex)
    {
        result = new JsonResult(false, ErrorCode: "UNHANDLED_EXCEPTION", Message: ex.Message);
    }

    Console.WriteLine(result.ToJson());
    return result.Success ? 0 : 1;
}

return Run(args);
