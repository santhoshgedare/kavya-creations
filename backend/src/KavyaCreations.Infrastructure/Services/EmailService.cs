using KavyaCreations.Application.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.Extensions.Options;

namespace KavyaCreations.Infrastructure.Services;

public sealed class EmailSettings
{
    public const string SectionName = "Email";
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromEmail { get; set; } = string.Empty;
    public string FromName { get; set; } = "Kavya Creations";
    public string FrontendBaseUrl { get; set; } = "http://localhost:4200";
}

public sealed class EmailService(IOptions<EmailSettings> options) : IEmailService
{
    private readonly EmailSettings _settings = options.Value;

    public Task SendEmailVerificationAsync(string email, string name, string token, CancellationToken ct = default)
    {
        var link = $"{_settings.FrontendBaseUrl}/auth/verify-email?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(email)}";
        var body = $"<p>Hi {name},</p><p>Please verify your email by clicking <a href='{link}'>here</a>.</p><p>— Kavya Creations</p>";
        return SendAsync(email, name, "Verify your Kavya Creations email", body, ct);
    }

    public Task SendPasswordResetAsync(string email, string name, string token, CancellationToken ct = default)
    {
        var link = $"{_settings.FrontendBaseUrl}/auth/reset-password?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(email)}";
        var body = $"<p>Hi {name},</p><p>Reset your password by clicking <a href='{link}'>here</a>. This link expires in 1 hour.</p><p>— Kavya Creations</p>";
        return SendAsync(email, name, "Reset your Kavya Creations password", body, ct);
    }

    public Task SendOrderConfirmationAsync(string email, string name, string orderNumber, CancellationToken ct = default)
    {
        var body = $"<p>Hi {name},</p><p>Your order <strong>{orderNumber}</strong> has been confirmed. Thank you for shopping with Kavya Creations!</p><p>— Kavya Creations</p>";
        return SendAsync(email, name, $"Order Confirmed: {orderNumber}", body, ct);
    }

    private async Task SendAsync(string toEmail, string toName, string subject, string htmlBody, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(_settings.Host)) return; // Skip in dev if not configured

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_settings.FromName, _settings.FromEmail));
        message.To.Add(new MailboxAddress(toName, toEmail));
        message.Subject = subject;
        message.Body = new TextPart("html") { Text = htmlBody };

        using var client = new SmtpClient();
        await client.ConnectAsync(_settings.Host, _settings.Port, SecureSocketOptions.StartTls, ct);
        await client.AuthenticateAsync(_settings.Username, _settings.Password, ct);
        await client.SendAsync(message, ct);
        await client.DisconnectAsync(true, ct);
    }
}
