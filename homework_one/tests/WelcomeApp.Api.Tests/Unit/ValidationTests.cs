using System.ComponentModel.DataAnnotations;
using FluentAssertions;
using WelcomeApp.Api.Dtos;

namespace WelcomeApp.Api.Tests.Unit;

public class ValidationTests
{
    private static IList<ValidationResult> Validate(object instance)
    {
        var results = new List<ValidationResult>();
        var context = new ValidationContext(instance);
        Validator.TryValidateObject(instance, context, results, validateAllProperties: true);
        return results;
    }

    [Fact]
    public void RegisterRequest_rejects_empty_name()
    {
        var req = new RegisterRequest { Name = "", Email = "a@b.co", Password = "Pass123" };
        Validate(req).Should().Contain(r => r.MemberNames.Contains(nameof(req.Name)));
    }

    [Fact]
    public void RegisterRequest_rejects_malformed_email()
    {
        var req = new RegisterRequest { Name = "Jane", Email = "not-an-email", Password = "Pass123" };
        Validate(req).Should().Contain(r => r.MemberNames.Contains(nameof(req.Email)));
    }

    [Fact]
    public void RegisterRequest_rejects_short_password()
    {
        var req = new RegisterRequest { Name = "Jane", Email = "a@b.co", Password = "abc" };
        Validate(req).Should().Contain(r => r.MemberNames.Contains(nameof(req.Password)));
    }

    [Fact]
    public void RegisterRequest_accepts_valid_input()
    {
        var req = new RegisterRequest { Name = "Jane", Email = "a@b.co", Password = "Pass123" };
        Validate(req).Should().BeEmpty();
    }
}
