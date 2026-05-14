using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using WelcomeApp.Api.Models;

namespace WelcomeApp.Api.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Workspace> Workspaces => Set<Workspace>();
    public DbSet<WorkspaceMember> WorkspaceMembers => Set<WorkspaceMember>();
    public DbSet<Draft> Drafts => Set<Draft>();
    public DbSet<Invite> Invites => Set<Invite>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Identity's default EmailIndex is non-unique; promote it so duplicate emails are
        // rejected at the DB level too, not only by application code.
        builder.Entity<ApplicationUser>()
            .HasIndex(u => u.NormalizedEmail)
            .IsUnique()
            .HasDatabaseName("EmailIndex")
            .HasFilter("[NormalizedEmail] IS NOT NULL");

        builder.Entity<Workspace>(entity =>
        {
            entity.HasKey(w => w.Id);
            entity.Property(w => w.Name).IsRequired().HasMaxLength(128);
            entity.Property(w => w.OwnerUserId).IsRequired();
            entity.Property(w => w.Plan).IsRequired().HasMaxLength(32);

            // Each user owns exactly one personal workspace in scope.
            entity.HasIndex(w => w.OwnerUserId).IsUnique();

            entity.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(w => w.OwnerUserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<WorkspaceMember>(entity =>
        {
            entity.HasKey(m => new { m.WorkspaceId, m.UserId });

            entity.HasOne<Workspace>()
                .WithMany()
                .HasForeignKey(m => m.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);

            // Restrict (not Cascade) breaks the multi-cascade-path:
            // User → WorkspaceMember and User → Workspace → WorkspaceMember would both cascade
            // and SQL Server rejects the migration with "may cause cycles or multiple cascade paths".
            entity.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(m => m.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Draft>(entity =>
        {
            entity.HasKey(d => d.Id);
            entity.Property(d => d.Title).IsRequired().HasMaxLength(256);
            entity.Property(d => d.UserId).IsRequired();

            entity.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Invite>(entity =>
        {
            entity.HasKey(i => i.Id);
            entity.Property(i => i.WorkspaceId).IsRequired();
            entity.Property(i => i.InvitedEmail).IsRequired().HasMaxLength(256);
            entity.Property(i => i.Status)
                .HasConversion<string>()
                .HasMaxLength(16)
                .IsRequired();

            entity.HasOne<Workspace>()
                .WithMany()
                .HasForeignKey(i => i.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Conversation>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.UserId).IsRequired();
            entity.Property(c => c.Title).IsRequired().HasMaxLength(256);

            entity.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(c => new { c.UserId, c.UpdatedAt })
                .IsDescending(false, true);
        });

        builder.Entity<ChatMessage>(entity =>
        {
            entity.HasKey(m => m.Id);
            entity.Property(m => m.ConversationId).IsRequired();
            entity.Property(m => m.Role).IsRequired().HasMaxLength(16);
            entity.Property(m => m.Content).IsRequired().HasColumnType("nvarchar(max)");

            entity.HasOne(m => m.Conversation)
                .WithMany(c => c.Messages)
                .HasForeignKey(m => m.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(m => new { m.ConversationId, m.CreatedAt });
        });
    }
}
