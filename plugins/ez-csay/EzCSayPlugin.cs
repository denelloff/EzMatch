using System.Text.RegularExpressions;
using CounterStrikeSharp.API;
using CounterStrikeSharp.API.Core;
using CounterStrikeSharp.API.Core.Attributes.Registration;
using CounterStrikeSharp.API.Modules.Commands;
using Microsoft.Extensions.Logging;

namespace EzCSay;

/// <summary>
/// Branded / colored server chat for eZ-Match.
/// Console <c>say</c> is rewritten as <c>[EZ-MATCH] …</c> with optional {color} tags.
/// Explicit <c>ezsay</c> / <c>csay</c> do the same.
/// </summary>
public class EzCSayPlugin : BasePlugin
{
    public override string ModuleName => "eZ-Match CSay";
    public override string ModuleAuthor => "denello";
    public override string ModuleVersion => "0.1.2";
    public override string ModuleDescription =>
        "Colored [EZ-MATCH] chat announcements from the server console.";

    private const string Brand = "[EZ-MATCH]";

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
        Logger.LogInformation("{Name} v{Version} loaded", ModuleName, ModuleVersion);
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
