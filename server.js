-- BLUE MODE HUB | LANGUAGE SUPPORT HELPER
-- Copyable Lua code
-- This does not replace your existing translation backend.

local HttpService = game:GetService("HttpService")

local TRANSLATION_URL =
    "https://translatorgui.onrender.com/translate"

local LANGUAGE_ALIASES = {
    ["english"] = "English",
    ["filipino"] = "Filipino",
    ["tagalog"] = "Tagalog",
    ["cebuano"] = "Cebuano",
    ["ilocano"] = "Ilocano",
    ["hiligaynon"] = "Hiligaynon",
    ["ilonggo"] = "Ilonggo",
    ["waray"] = "Waray",
    ["spanish"] = "Spanish",
    ["french"] = "French",
    ["german"] = "German",
    ["japanese"] = "Japanese",
    ["korean"] = "Korean",
    ["chinese"] = "Chinese",
    ["mandarin"] = "Mandarin",
    ["arabic"] = "Arabic",
    ["hindi"] = "Hindi",
    ["bengali"] = "Bengali",
    ["burmese"] = "Burmese",
    ["khmer"] = "Khmer",
    ["lao"] = "Lao",
    ["mongolian"] = "Mongolian",
    ["assamese"] = "Assamese",
    ["portuguese"] = "Portuguese",
    ["russian"] = "Russian",
    ["italian"] = "Italian",
    ["dutch"] = "Dutch",
    ["indonesian"] = "Indonesian",
    ["vietnamese"] = "Vietnamese",
    ["thai"] = "Thai",
    ["turkish"] = "Turkish",
    ["ukrainian"] = "Ukrainian",
    ["polish"] = "Polish",
    ["greek"] = "Greek",
    ["hebrew"] = "Hebrew",
    ["malay"] = "Malay",
    ["swahili"] = "Swahili",
    ["tamil"] = "Tamil",
    ["telugu"] = "Telugu",
    ["marathi"] = "Marathi",
    ["punjabi"] = "Punjabi",
    ["romanian"] = "Romanian",
    ["czech"] = "Czech",
    ["hungarian"] = "Hungarian",
    ["swedish"] = "Swedish",
    ["norwegian"] = "Norwegian",
    ["danish"] = "Danish",
    ["finnish"] = "Finnish",
    ["persian"] = "Persian",
    ["nepali"] = "Nepali",
    ["gujarati"] = "Gujarati",
    ["kannada"] = "Kannada",
    ["malayalam"] = "Malayalam",
    ["serbian"] = "Serbian",
    ["croatian"] = "Croatian",
    ["slovak"] = "Slovak",
}

local function NormalizeLanguage(language)
    if type(language) ~= "string" or language == "" then
        return "English"
    end

    local key = string.lower(language)
    return LANGUAGE_ALIASES[key] or language
end

local function TranslateText(text, targetLanguage)
    if type(text) ~= "string" or text == "" then
        return nil, "Please enter text to translate."
    end

    local payload = {
        text = text,
        targetLanguage = NormalizeLanguage(targetLanguage)
    }

    local success, response = pcall(function()
        return HttpService:RequestAsync({
            Url = TRANSLATION_URL,
            Method = "POST",
            Headers = {
                ["Content-Type"] = "application/json"
            },
            Body = HttpService:JSONEncode(payload)
        })
    end)

    if not success then
        return nil, "Translation request failed: " .. tostring(response)
    end

    if not response.Success then
        return nil, "Translation server returned HTTP "
            .. tostring(response.StatusCode)
    end

    local decodedSuccess, data = pcall(function()
        return HttpService:JSONDecode(response.Body)
    end)

    if not decodedSuccess or type(data) ~= "table" then
        return nil, "Invalid translation server response."
    end

    if type(data.translatedText) ~= "string" then
        return nil, data.error or "No translated text was returned."
    end

    local detectedLanguage =
        data.detectedLanguageName
        or data.detectedLanguage
        or "Undetermined"

    if detectedLanguage == "und" or detectedLanguage == "" then
        detectedLanguage = "Undetermined"
    end

    return data.translatedText, detectedLanguage
end

-- Example:
-- local translated, detected = TranslateText(
--     "Kumusta ka?",
--     "English"
-- )
--
-- if translated then
--     print("Translation:", translated)
--     print("Detected language:", detected)
-- else
--     warn(detected)
-- end
