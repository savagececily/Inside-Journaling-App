namespace Journal.Models
{
    public static class CrisisKeywords
    {
        public static readonly HashSet<string> DefaultKeywords = new(StringComparer.OrdinalIgnoreCase)
        {
            "suicide", "suicidal", "kill myself", "end it all", "end my life",
            "no reason to live", "better off dead", "want to die",
            "self-harm", "self harm", "hurt myself", "cut myself",
            "don't want to exist", "wish I was dead", "plan to die",
            "overdose", "jump off", "hang myself"
        };

        public static bool ContainsCrisisKeyword(string? text)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return false;
            }

            return DefaultKeywords.Any(k => text.Contains(k, StringComparison.OrdinalIgnoreCase));
        }
    }
}
