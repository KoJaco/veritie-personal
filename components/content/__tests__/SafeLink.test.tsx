import { describe, it, expect } from "@jest/globals"
import { isSafeLink } from "../MarkdownComponents"

describe("SafeLink - Export Verification", () => {
  it("exports isSafeLink function", () => {
    expect(isSafeLink).toBeDefined()
    expect(typeof isSafeLink).toBe("function")
  })

  it("isSafeLink has correct signature", () => {
    expect(isSafeLink).toHaveLength(1)
  })
})

describe("isSafeLink - Core Functionality", () => {
  describe("Protocol Validation", () => {
    it("allows https:// URLs", () => {
      expect(isSafeLink("https://example.com")).toBe(true)
    })

    it("allows http:// URLs", () => {
      expect(isSafeLink("http://example.com")).toBe(true)
    })

    it("allows mailto: URLs", () => {
      expect(isSafeLink("mailto:test@example.com")).toBe(true)
    })

    it("allows tel: URLs", () => {
      expect(isSafeLink("tel:+61400111222")).toBe(true)
    })

    it("allows internal paths starting with /", () => {
      expect(isSafeLink("/work/documents/doc-123")).toBe(true)
    })

    it("allows anchor links starting with #", () => {
      expect(isSafeLink("#section-2")).toBe(true)
    })

    it("blocks javascript: protocol", () => {
      expect(isSafeLink("javascript:alert(1)")).toBe(false)
    })

    it("blocks javascript: protocol with mixed case", () => {
      expect(isSafeLink("JaVaScRiPt:alert(1)")).toBe(false)
    })

    it("blocks data: protocol", () => {
      expect(isSafeLink("data:text/html;base64,xxx")).toBe(false)
    })

    it("blocks protocol-relative URLs (//evil.com)", () => {
      expect(isSafeLink("//evil.com")).toBe(false)
    })

    it("blocks ftp:// protocol (not in allowlist)", () => {
      expect(isSafeLink("ftp://example.com")).toBe(false)
    })

    it("blocks file:// protocol", () => {
      expect(isSafeLink("file:///etc/passwd")).toBe(false)
    })

    it("blocks about: protocol", () => {
      expect(isSafeLink("about:blank")).toBe(false)
    })

    it("blocks blob: URLs", () => {
      expect(isSafeLink("blob:https://example.com")).toBe(false)
    })

    it("returns false for undefined href", () => {
      expect(isSafeLink(undefined)).toBe(false)
    })

    it("returns false for empty href", () => {
      expect(isSafeLink("")).toBe(false)
    })

    it("trims leading/trailing whitespace", () => {
      expect(isSafeLink("  https://example.com  ")).toBe(true)
    })

    it("preserves case in URLs", () => {
      expect(isSafeLink("HTTPS://EXAMPLE.COM")).toBe(true)
    })
  })

  describe("URL Patterns", () => {
    it("handles very long URLs", () => {
      expect(
        isSafeLink("https://example.com/very/long/path/with/many/segments")
      ).toBe(true)
    })

    it("handles URLs with special characters", () => {
      expect(
        isSafeLink("https://example.com/path?query=value&other=thing#section")
      ).toBe(true)
    })

    it("handles tel: with various formats", () => {
      expect(isSafeLink("tel:+1-555-123-4567")).toBe(true)
      expect(isSafeLink("tel:011-555-123-4567")).toBe(true)
    })

    it("handles mailto: with encoding", () => {
      expect(isSafeLink("mailto:user%40example.com?subject=Test")).toBe(true)
    })
  })

  describe("Security Edge Cases", () => {
    describe("XSS Vectors", () => {
      it("blocks javascript: URL", () => {
        expect(isSafeLink("javascript:alert(1)")).toBe(false)
      })

      it("blocks javascript: URL with obfuscation", () => {
        expect(isSafeLink("javascripT:alert(1)")).toBe(false)
      })

      it("blocks javascript: in URL path", () => {
        expect(isSafeLink("  javascript:alert(1)")).toBe(false)
      })
    })

    it("blocks data: URL with base64", () => {
      expect(isSafeLink("data:text/html;base64,xxx")).toBe(false)
    })

    it("blocks data: URL with encoding", () => {
      expect(isSafeLink("data:text/html,%3Cscript%3Ealert(1)")).toBe(false)
    })
  })

  describe("Protocol Bypass Attempts", () => {
    it("blocks javascript: protocol with spaces", () => {
      expect(isSafeLink(" javascript:alert(1)")).toBe(false)
      expect(isSafeLink("\njavascript:alert(1)")).toBe(false)
      expect(isSafeLink("javascript :alert(1)")).toBe(false)
      expect(isSafeLink("java\nscript:alert(1)")).toBe(false)
    })

    it("blocks data: protocol with spaces", () => {
      expect(isSafeLink("data:text/html;base64,xxx")).toBe(false)
      expect(isSafeLink("\ndata:text/html;base64,xxx")).toBe(false)
      expect(isSafeLink("data :text/html;base64,xxx")).toBe(false)
    })
  })

  describe("Normalization Behavior", () => {
    it("trims spaces", () => {
      expect(isSafeLink("  https://example.com  ")).toBe(true)
    })

    it("trims tabs", () => {
      expect(isSafeLink("\thttps://example.com")).toBe(true)
    })

    it("handles multiple leading/trailing spaces", () => {
      expect(isSafeLink("   \n  https://example.com  \n  ")).toBe(true)
    })

    it("preserves case", () => {
      expect(isSafeLink("HTTPS://EXAMPLE.COM")).toBe(true)
      expect(isSafeLink("https://example.com")).toBe(true)
    })
  })
})