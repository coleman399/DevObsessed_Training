using AgpCommandStation.Api.Services;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace AgpCommandStation.Api.Tests;

public class EncryptionServiceTests
{
    private static EncryptionService MakeService()
    {
        // 32-byte key as hex
        var key = "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20";
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Encryption:Key"] = key })
            .Build();
        return new EncryptionService(config);
    }

    [Fact]
    public void RoundTrip_PlaintextSurvives()
    {
        var svc = MakeService();
        const string plain = "sk-ant-api03-test-key";
        var encrypted = svc.Encrypt(plain);
        svc.Decrypt(encrypted).Should().Be(plain);
    }

    [Fact]
    public void Encrypt_ProducesDifferentCiphertextEachTime()
    {
        var svc = MakeService();
        const string plain = "test";
        svc.Encrypt(plain).Should().NotBe(svc.Encrypt(plain));
    }

    [Fact]
    public void Decrypt_CorruptedInput_Throws()
    {
        var svc = MakeService();
        var act = () => svc.Decrypt(Convert.ToBase64String(new byte[50]));
        act.Should().Throw<Exception>();
    }
}
