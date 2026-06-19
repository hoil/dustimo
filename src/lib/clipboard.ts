export const copyTextWithFallback = async (text: string) => {

    if (!text)
    {

        return false;

    }

    if (navigator.clipboard?.writeText && window.isSecureContext)
    {

        try
        {

            await navigator.clipboard.writeText(text);

            return true;

        }
        catch
        {

            // fallback below

        }

    }

    const textArea = document.createElement("textarea");

    textArea.value = text;
    textArea.readOnly = true;
    textArea.setAttribute("aria-hidden", "true");
    textArea.style.position = "fixed";
    textArea.style.left = "0";
    textArea.style.top = "0";
    textArea.style.width = "1px";
    textArea.style.height = "1px";
    textArea.style.padding = "0";
    textArea.style.border = "0";
    textArea.style.opacity = "0";
    textArea.style.fontSize = "16px";

    document.body.appendChild(textArea);
    textArea.focus({ preventScroll: true });
    textArea.select();
    textArea.setSelectionRange(0, text.length);

    try
    {

        return document.execCommand("copy");

    }
    catch
    {

        return false;

    }
    finally
    {

        textArea.remove();

    }

};
