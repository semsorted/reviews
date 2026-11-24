import { describe, expect, it } from "vitest";
import { billNumber, billTotals, billUpiUrl, financialYear, formatPaise, rupeesToPaise } from "@/lib/ordering/bill";

describe("ordering bill", () => {
  it("splits 5% GST into equal CGST and SGST and rounds the total to a rupee", () => {
    const bill = billTotals([{ pricePaise: 12000, qty: 2 }, { pricePaise: 4550, qty: 1 }], 500);
    expect(bill).toEqual({ subtotal: 28550, cgst: 714, sgst: 714, roundOff: 22, total: 30000 });
  });

  it("charges 18% for hotels and nothing without GST", () => {
    expect(billTotals([{ pricePaise: 100000, qty: 1 }], 1800)).toMatchObject({ cgst: 9000, sgst: 9000, total: 118000, roundOff: 0 });
    expect(billTotals([{ pricePaise: 9950, qty: 1 }], 0)).toEqual({ subtotal: 9950, cgst: 0, sgst: 0, roundOff: 50, total: 10000 });
  });

  it("keeps the round off between -50 and +50 paise", () => {
    for (let paise = 0; paise < 400; paise += 7) {
      const bill = billTotals([{ pricePaise: 10000 + paise, qty: 3 }], 500);
      expect(Math.abs(bill.roundOff)).toBeLessThanOrEqual(50);
      expect(bill.total % 100).toBe(0);
      expect(bill.subtotal + bill.cgst + bill.sgst + bill.roundOff).toBe(bill.total);
    }
  });

  it("starts a new financial year on 1 April in India", () => {
    expect(financialYear(new Date("2027-03-31T18:29:00Z"))).toBe(2026);
    expect(financialYear(new Date("2027-03-31T18:31:00Z"))).toBe(2027);
    expect(billNumber(2026, 42)).toBe("26-27/000042");
    expect(billNumber(2099, 7)).toBe("99-00/000007");
  });

  it("reads rupees typed by the admin", () => {
    expect(rupeesToPaise("120")).toBe(12000);
    expect(rupeesToPaise(" 45.5 ")).toBe(4550);
    expect(rupeesToPaise("0.05")).toBe(5);
    for (const bad of ["", "-1", "1.234", "abc", "1e3", "100001"]) expect(rupeesToPaise(bad)).toBeNull();
  });

  it("formats paise as rupees", () => {
    expect(formatPaise(30000)).toBe("₹300");
    expect(formatPaise(4550)).toBe("₹45.50");
    expect(formatPaise(12345678)).toBe("₹1,23,456.78");
  });

  it("puts the bill amount and number into the restaurant's UPI link", () => {
    const url = billUpiUrl("upi://pay?pa=shop@okbank&pn=Shop&am=1", 30000, "26-27/000042");
    expect(url).not.toBeNull();
    const params = new URL(url!).searchParams;
    expect(params.get("pa")).toBe("shop@okbank");
    expect(params.get("am")).toBe("300.00");
    expect(params.get("cu")).toBe("INR");
    expect(params.get("tn")).toBe("Bill 26-27/000042");
    expect(billUpiUrl("https://example.com/pay", 100, "x")).toBeNull();
    expect(billUpiUrl(null, 100, "x")).toBeNull();
  });
});
