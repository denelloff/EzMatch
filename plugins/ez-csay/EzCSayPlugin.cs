using System.Text.RegularExpressions;
using CounterStrikeSharp.API;
using CounterStrikeSharp.API.Core;
using CounterStrikeSharp.API.Core.Attributes.Registration;
using CounterStrikeSharp.API.Modules.Commands;
using CounterStrikeSharp.API.Modules.UserMessages;
using Microsoft.Extensions.Logging;

namespace EzCSay;

/// <summary>
/// Branded / colored server chat for eZ-Match.
/// Console <c>say</c> is rewritten as <c>[EZ-MATCH] …</c> with optional {color} tags.
/// Explicit <c>ezsay</c> / <c>csay</c> do the same.
/// Also suppresses the stock CS2 "Restoring match backup …" line so only our
/// branded announce (with operator name) is shown.
/// </summary>
public class EzCSayPlugin : BasePlugin
{
    public override string ModuleName => "eZ-Match CSay";
    public override string ModuleAuthor => "denello";
    public override string ModuleVersion => "0.1.3";
    public override string ModuleDescription =>
        "Colored [EZ-MATCH] chat announcements from the server console.";

    private const string Brand = "[EZ-MATCH]";
    /// <summary>Protobuf id for <c>CUserMessageSayText2</c>.</summary>
    private const int SayText2Id = 118;
    /// <summary>Protobuf id for <c>CUserMessageSayText</c>.</summary>
    private const int SayTextId = 117;
    /// <summary>Protobuf id for <c>CUserMessageTextMsg</c> (HUD_PRINTTALK etc.).</summary>
    private const int TextMsgId = 124;

    /// <summary>
    /// Engine restore announce sometimes bypasses string matching on SayText fields.
    /// After <c>mp_backup_restore_load_file</c>, drop non-branded chat briefly.
    /// Hub sends our branded line *before* the restore command, so it stays visible.
    /// </summary>
    private DateTime _suppressNonBrandedUntilUtc = DateTime.MinValue;
    private static readonly TimeSpan RestoreSuppressWindow = TimeSpan.FromSeconds(4);

    private static readonly Dictionary<string, int> ColorMap = new(StringComparer.OrdinalIgnoreCase)
    {
        ["{default}"] = 1,
        ["{white}"] = 1,
        ["{darkred}"] = 2,
        ["{purple}"] = 3,
        ["{green}"] = 4,
        ["{lightgreen}"] = 5,
        ["{slimegreen}"] = 6,
        ["{red}"] = 7,
        ["{grey}"] = 8,
        ["{gray}"] = 8,
        ["{yellow}"] = 9,
        ["{invisible}"] = 10,
        ["{lightblue}"] = 11,
        ["{blue}"] = 12,
        ["{lightpurple}"] = 13,
        ["{pink}"] = 14,
        ["{fadedred}"] = 15,
        ["{gold}"] = 16,
    };

    public override void Load(bool hotReload)
    {
        AddCommandListener("say", OnConsoleSay);
        AddCommandListener("mp_backup_restore_load_file", OnBackupRestoreLoad, HookMode.Pre);
        // Engine backup-restore announce bypasses console `say` — filter it here.
        HookUserMessage(SayText2Id, OnChatUserMessage, HookMode.Pre);
        HookUserMessage(SayTextId, OnChatUserMessage, HookMode.Pre);
        HookUserMessage(TextMsgId, OnChatUserMessage, HookMode.Pre);
        Logger.LogInformation("{Name} v{Version} loaded", ModuleName, ModuleVersion);
    }

    private HookResult OnBackupRestoreLoad(CCSPlayerController? player, CommandInfo info)
    {
        _suppressNonBrandedUntilUtc = DateTime.UtcNow + RestoreSuppressWindow;
        Logger.LogInformation(
            "Suppressing non-branded chat until {Until} (mp_backup_restore_load_file)",
            _suppressNonBrandedUntilUtc);
        return HookResult.Continue;
    }

    private HookResult OnChatUserMessage(UserMessage message)
    {
        try
        {
            var suppressing = DateTime.UtcNow < _suppressNonBrandedUntilUtc;
            var candidates = CollectMessageStrings(message);

            foreach (var raw in candidates)
            {
                if (string.IsNullOrEmpty(raw)) continue;
                if (IsNativeBackupRestoreAnnounce(raw))
                {
                    return HookResult.Stop;
                }
            }

            if (suppressing)
            {
                // During the restore window, keep only our branded lines.
                var anyBranded = false;
                var anyText = false;
                foreach (var raw in candidates)
                {
                    if (string.IsNullOrWhiteSpace(raw)) continue;
                    anyText = true;
                    var plain = StripChatCodes(raw);
                    if (plain.Contains(Brand, StringComparison.OrdinalIgnoreCase))
                    {
                        anyBranded = true;
                        break;
                    }
                }

                if (anyText && !anyBranded)
                {
                    return HookResult.Stop;
                }
            }
        }
        catch (Exception ex)
        {
            Logger.LogDebug(ex, "chat usermessage filter failed");
        }

        return HookResult.Continue;
    }

    private static IEnumerable<string> CollectMessageStrings(UserMessage message)
    {
        // SayText2: param1 = author, param2 = body.
        // SayText / TextMsg: body may live in param0/param1/message/text.
        foreach (var field in new[]
                 {
                     "param2", "param1", "param0", "param3", "param4",
                     "message", "text", "messagename",
                 })
        {
            var value = SafeReadString(message, field);
            if (!string.IsNullOrEmpty(value)) yield return value;
        }
    }

    private static string SafeReadString(UserMessage message, string field)
    {
        try
        {
            return message.ReadString(field) ?? string.Empty;
        }
        catch
        {
            return string.Empty;
        }
    }

    /// <summary>
    /// Stock CS2 line has no [EZ-MATCH] prefix. Our hub announce is branded and kept.
    /// </summary>
    internal static bool IsNativeBackupRestoreAnnounce(string message)
    {
        var plain = StripChatCodes(message).TrimStart();
        if (plain.Contains(Brand, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        // StartsWith misses odd prefixes / console wrappers; Contains is safer.
        return plain.Contains("Restoring match backup", StringComparison.OrdinalIgnoreCase);
    }

    private static string StripChatCodes(string value)
    {
        // Drop CS2 color codes (0x01–0x10) and the leading ZWSP PrintToChat quirk.
        var chars = value.Where(ch => ch is not '\u200B' && (ch < '\u0001' || ch > '\u0010'));
        return string.Concat(chars);
    }

    private HookResult OnConsoleSay(CCSPlayerController? player, CommandInfo info)
    {
        // Only rewrite server-console say (match panel / hub). Players keep normal chat.
        if (player != null || info.CallingContext != CommandCallingContext.Console)
        {
            return HookResult.Continue;
        }

        var raw = StripOuterQuotes(info.ArgString);
        if (string.IsNullOrWhiteSpace(raw))
        {
            return HookResult.Handled;
        }

        PrintBranded(raw);
        return HookResult.Handled;
    }

    [ConsoleCommand("ezsay", "Broadcast a branded [EZ-MATCH] chat message (supports {green} tags)")]
    [ConsoleCommand("csay", "Alias for ezsay")]
    [ConsoleCommand("colorsay", "Alias for ezsay")]
    [CommandHelper(whoCanExecute: CommandUsage.SERVER_ONLY)]
    public void OnEzSay(CCSPlayerController? _, CommandInfo command)
    {
        if (command.ArgCount < 2)
        {
            command.ReplyToCommand("Usage: ezsay \"message with optional {green}tags\"");
            return;
        }

        // Arg1 is the first argument; multi-word messages should be quoted by the caller.
        var message = command.ArgCount == 2
            ? command.GetArg(1)
            : string.Join(' ', Enumerable.Range(1, command.ArgCount - 1).Select(command.GetArg));

        if (string.IsNullOrWhiteSpace(message))
        {
            command.ReplyToCommand("Message cannot be empty");
            return;
        }

        PrintBranded(message);
    }

    private void PrintBranded(string message)
    {
        var text = FormatBranded(message);
        Server.PrintToChatAll(text);
        Logger.LogInformation("ezsay {Message}", text);
    }

    internal static string FormatBranded(string message)
    {
        var body = StripOuterQuotes(message).Trim();
        if (body.Length == 0) return body;

        // Avoid double prefix if the hub already sent "[EZ-MATCH] …".
        string rest;
        if (body.StartsWith(Brand, StringComparison.OrdinalIgnoreCase))
        {
            rest = body[Brand.Length..].TrimStart();
        }
        else
        {
            rest = body;
        }

        var coloredBrand = $"{ColorChar(4)}{Brand}{ColorChar(1)}";
        var coloredBody = ColorizeBody(ApplyColorTags(rest));
        // Leading ZWSP is a CS2 quirk so the first color code applies.
        return $"\u200B{coloredBrand} {coloredBody}";
    }

    private static string ColorizeBody(string body)
    {
        // Already tagged via {blue}/… — do not override team colors on ready lines.
        foreach (var ch in body)
        {
            if (ch >= '\u0001' && ch <= '\u0010') return body;
        }

        if (body.IndexOf("Knife", StringComparison.OrdinalIgnoreCase) >= 0
            || body.Equals("KNIFE", StringComparison.OrdinalIgnoreCase))
        {
            return $"{ColorChar(9)}{body}{ColorChar(1)}";
        }
        if (body.IndexOf("OVERTIME", StringComparison.OrdinalIgnoreCase) >= 0)
        {
            return $"{ColorChar(9)}{body}{ColorChar(1)}";
        }
        if (body.IndexOf("LIVE", StringComparison.OrdinalIgnoreCase) >= 0)
        {
            return $"{ColorChar(4)}{body}{ColorChar(1)}";
        }
        if (body.IndexOf("not ready", StringComparison.OrdinalIgnoreCase) >= 0)
        {
            return $"{ColorChar(7)}{body}{ColorChar(1)}";
        }
        if (body.IndexOf("ready", StringComparison.OrdinalIgnoreCase) >= 0)
        {
            return $"{ColorChar(5)}{body}{ColorChar(1)}";
        }
        return body;
    }

    private static string ApplyColorTags(string message)
    {
        return Regex.Replace(
            message,
            @"\{(\w+)\}",
            match =>
            {
                var key = "{" + match.Groups[1].Value.ToLowerInvariant() + "}";
                return ColorMap.TryGetValue(key, out var code)
                    ? ColorChar(code)
                    : match.Value;
            },
            RegexOptions.IgnoreCase);
    }

    private static string ColorChar(int code) => Convert.ToChar(code).ToString();

    private static string StripOuterQuotes(string value)
    {
        var trimmed = value.Trim();
        if (trimmed.Length >= 2 && trimmed[0] == '"' && trimmed[^1] == '"')
        {
            return trimmed[1..^1];
        }
        return trimmed;
    }
}
