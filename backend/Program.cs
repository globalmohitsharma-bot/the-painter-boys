using Microsoft.AspNetCore.DataProtection;
using ThePainterBoys.Api.Auth;
using ThePainterBoys.Api.Configuration;
using ThePainterBoys.Api.Repositories;
using ThePainterBoys.Api.Repositories.Interfaces;
using ThePainterBoys.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();
builder.Services.AddHttpClient();

builder.Services.AddCosmosDb(builder.Configuration);
builder.Services.AddBlobStorage(builder.Configuration);
builder.Services.Configure<GoogleAuthOptions>(builder.Configuration.GetSection(GoogleAuthOptions.SectionName));
builder.Services.Configure<EmailOptions>(builder.Configuration.GetSection(EmailOptions.SectionName));

builder.Services.AddScoped<IClientRepository, ClientRepository>();
builder.Services.AddScoped<IQuotationRepository, QuotationRepository>();
builder.Services.AddScoped<IProjectRepository, ProjectRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IEmailService, SmtpEmailService>();
builder.Services.AddScoped<SheetSyncService>();
builder.Services.AddHostedService<WeeklySheetSyncBackgroundService>();
builder.Services.AddScoped<SheetPushSyncService>();
// WeeklySheetPushSyncBackgroundService is NOT registered yet, deliberately —
// an unsupervised weekly push has no one to catch a bad write the way the
// manual preview-then-confirm flow does. Register it once the manual flow
// has been used and trusted for a while (see SheetSyncController.PushPreview
// and .Push, and the Admin Portal's Push to Google Sheet button).

// Without an explicit persisted key ring, Data Protection keys live wherever
// the framework defaults to on this host — on Azure App Service that default
// isn't guaranteed to survive a redeploy/restart the way /home does, which
// would silently invalidate every issued session token (and impersonation
// link) and 401 everyone back to a fresh sign-in on the next release. /home
// is Azure App Service's durable, Azure-Files-backed directory — untouched
// by a code deploy (only wwwroot gets replaced) and shared across scaled-out
// instances, so keys placed there outlive both.
var dataProtectionKeysPath = Environment.GetEnvironmentVariable("HOME") is { Length: > 0 } homeDir
    ? Path.Combine(homeDir, "data-protection-keys")
    : Path.Combine(builder.Environment.ContentRootPath, "data-protection-keys");
builder.Services.AddDataProtection()
    .SetApplicationName("ThePainterBoysApi")
    .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionKeysPath));

builder.Services
    .AddAuthentication(GoogleTokenAuthenticationHandler.SchemeName)
    .AddScheme<Microsoft.AspNetCore.Authentication.AuthenticationSchemeOptions, GoogleTokenAuthenticationHandler>(
        GoogleTokenAuthenticationHandler.SchemeName, null);
builder.Services.AddAuthorization();

var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    // One-off local promotion for the 🧪 dev test-admin account — not
    // reachable once deployed, removed once no longer needed.
    app.MapPost("/api/dev/promote-test-admin", async (IUserRepository userRepo, CancellationToken ct) =>
    {
        const string email = GoogleTokenAuthenticationHandler.DevTestAdminEmail;
        var user = await userRepo.GetByEmailAsync(email, ct)
            ?? new ThePainterBoys.Api.Models.Entities.User { Email = email, Name = "Test Admin" };
        user.Role = ThePainterBoys.Api.Models.Entities.UserRole.Admin;
        var saved = await userRepo.UpsertAsync(user, ct);
        return Results.Ok(new { saved.Id, saved.Email, saved.Role });
    });
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
