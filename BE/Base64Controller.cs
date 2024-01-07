// Base64Controller.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

[ApiController]
[Route("api/[controller]")]
public class Base64Controller : ControllerBase
{
    private static readonly object lockObject = new object();
    private CancellationTokenSource cancellationTokenSource;
    private readonly IHubContext<Base64Hub> hubContext;

    public Base64Controller(IHubContext<Base64Hub> hubContext)
    {
        this.hubContext = hubContext;
    }

    private CancellationTokenSource CreateCancellationTokenSource()
    {
        lock (lockObject)
        {
            cancellationTokenSource?.Dispose();
            return cancellationTokenSource = new CancellationTokenSource();
        }
    }

    private CancellationToken GetCancellationToken()
    {
        lock (lockObject)
        {
            return cancellationTokenSource.Token;
        }
    }

    [HttpPost("encode")]
    public async Task<IActionResult> Encode([FromBody] string text)
    {
        try
        {
            lock (lockObject)
            {
                cancellationTokenSource?.Cancel();
                cancellationTokenSource?.Dispose();
                CreateCancellationTokenSource();
            }

            if (string.IsNullOrEmpty(text))
            {
                return BadRequest("Text cannot be empty");
            }

            StringBuilder encodedText = new StringBuilder();

            byte[] textBytes = Encoding.UTF8.GetBytes(text);
            string base64Text = Convert.ToBase64String(textBytes);

            for (int i = 0; i < base64Text.Length; i++)
            {
                if (GetCancellationToken().IsCancellationRequested)
                {
                    return Ok("Encoding process canceled.");
                }

                await Task.Delay(new Random().Next(1000, 2000)); // Simulate random pause
                encodedText.Append(base64Text[i]);
                await SendPartialResultToClient(encodedText.ToString());
            }

            return Ok(new { message = "Encoding Process Completed" });
        }
        catch (OperationCanceledException)
        {
            return Ok("Encoding process canceled.");
        }
        finally
        {
            lock (lockObject)
            {
                cancellationTokenSource?.Dispose();
                cancellationTokenSource = null;
            }
        }
    }

    [HttpPost("cancel")]
    public IActionResult Cancel()
    {
        lock (lockObject)
        {
            if (cancellationTokenSource != null && !cancellationTokenSource.Token.IsCancellationRequested)
            {
                cancellationTokenSource.Cancel();
            }

            return Ok(new { message = "Cancel request received. Cancelling the encoding process." });
        }
    }

    private async Task SendPartialResultToClient(string partialResult)
    {
        if (GetCancellationToken().IsCancellationRequested)
        {
            // Handle cancellation before sending partial result
            throw new OperationCanceledException();
        }

        await hubContext.Clients.All.SendAsync("PartialResult", partialResult);
    }
}
