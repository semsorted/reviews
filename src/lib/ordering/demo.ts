import { randomBytes, randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { chipsForShopType } from "@/lib/reviews/catalog";
import { MAX_ACTIVE_CHIPS } from "@/lib/reviews/rules";
import { generateToken } from "@/lib/utils";
import { publicQrUrl } from "@/lib/admin/api";
import { freezeBill } from "./service";
import { hashSecret } from "./staff-auth";

export const DEMO_SLUG = "demo-dhaba";

// name, Hindi name, price in rupees, veg
const MENU: { category: string; categoryHi: string; items: [string, string, number, boolean][] }[] = [
  { category: "Starters", categoryHi: "स्टार्टर", items: [["Paneer Tikka", "पनीर टिक्का", 220, true], ["Veg Manchurian", "वेज मंचूरियन", 160, true], ["Chicken Tikka", "चिकन टिक्का", 260, false], ["Masala Papad", "मसाला पापड़", 60, true]] },
  { category: "Main course", categoryHi: "मेन कोर्स", items: [["Dal Makhani", "दाल मखनी", 190, true], ["Butter Chicken", "बटर चिकन", 310, false], ["Kadhai Paneer", "कढ़ाई पनीर", 240, true], ["Butter Naan", "बटर नान", 45, true], ["Jeera Rice", "जीरा राइस", 120, true]] },
  { category: "Drinks and sweets", categoryHi: "ड्रिंक्स और मिठाई", items: [["Sweet Lassi", "मीठी लस्सी", 80, true], ["Masala Chai", "मसाला चाय", 30, true], ["Gulab Jamun", "गुलाब जामुन", 70, true]] },
];

/** A sample restaurant with a menu, tables, staff and a few orders, so a new owner can see how it works. */
export async function createDemoRestaurant(adminId: string) {
  if (await prisma.shop.findFirst({ where: { slug: { startsWith: DEMO_SLUG } }, select: { id: true } })) return null;

  const suffix = randomBytes(2).toString("hex");
  const passwords = { owner: generateToken(10), kitchen: generateToken(10), waiter: generateToken(10) };
  const staff = [
    { name: "Ramesh (owner)", role: "OWNER", login: `demo.owner.${suffix}`, password: passwords.owner },
    { name: "Sunita (kitchen)", role: "KITCHEN", login: `demo.kitchen.${suffix}`, password: passwords.kitchen },
    { name: "Imran (waiter)", role: "WAITER", login: `demo.waiter.${suffix}`, password: passwords.waiter },
  ];
  const hashes = await Promise.all(staff.map((person) => hashSecret(person.password)));
  const publicToken = generateToken(18);
  const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000);

  const shopId = await prisma.$transaction(async (tx) => {
    const shop = await tx.shop.create({
      data: {
        name: "Demo Dhaba (sample)",
        slug: `${DEMO_SLUG}-${generateToken(6).toLowerCase()}`,
        businessCategory: "Restaurant",
        googleReviewUrl: "https://g.page/r/semsorted-demo/review",
        ownerId: adminId,
        chips: { create: chipsForShopType("Restaurant").slice(0, MAX_ACTIVE_CHIPS).map((label, sortOrder) => ({ label, sortOrder })) },
        qrCodes: { create: { name: "Main QR", publicToken, destinationUrl: publicQrUrl(publicToken) } },
      },
      select: { id: true },
    });
    await tx.orderingSettings.create({ data: { shopId: shop.id, isEnabled: true } });
    await tx.restaurantStaff.createMany({ data: staff.map((person, index) => ({ shopId: shop.id, name: person.name, role: person.role, login: person.login, passwordHash: hashes[index] })) });

    const items: { id: string; name: string; pricePaise: number; isVeg: boolean }[] = [];
    for (const [categoryIndex, group] of MENU.entries()) {
      const category = await tx.menuCategory.create({ data: { shopId: shop.id, name: group.category, nameHi: group.categoryHi, sortOrder: categoryIndex } });
      for (const [itemIndex, [name, nameHi, rupees, isVeg]] of group.items.entries()) {
        items.push(await tx.menuItem.create({ data: { shopId: shop.id, categoryId: category.id, name, nameHi, pricePaise: rupees * 100, isVeg, sortOrder: itemIndex }, select: { id: true, name: true, pricePaise: true, isVeg: true } }));
      }
    }
    const dish = (name: string) => items.find((item) => item.name === name)!;

    const tables = await Promise.all(["T1", "T2", "T3", "T4", "T5", "T6"].map((label) => tx.diningTable.create({ data: { shopId: shop.id, label, publicToken: generateToken(24) } })));
    const order = (sessionId: string, status: string, minutes: number, lines: [string, number][]) =>
      tx.order.create({
        data: {
          sessionId, shopId: shop.id, status, idempotencyKey: randomUUID(), createdAt: ago(minutes), servedAt: status === "SERVED" ? ago(minutes - 12) : null,
          items: { create: lines.map(([name, qty]) => ({ menuItemId: dish(name).id, name, pricePaise: dish(name).pricePaise, isVeg: dish(name).isVeg, qty })) },
        },
      });
    const session = (tableIndex: number, partySize: number, minutes: number, status = "OPEN") =>
      tx.tableSession.create({ data: { shopId: shop.id, tableId: tables[tableIndex].id, partySize, status, createdAt: ago(minutes) } });

    // Live tables: one just ordered, one is cooking, one has eaten and is about to ask for the bill.
    const t1 = await session(0, 3, 4);
    await order(t1.id, "RECEIVED", 3, [["Paneer Tikka", 1], ["Butter Naan", 4], ["Dal Makhani", 1]]);
    const t2 = await session(1, 2, 22);
    await order(t2.id, "PREPARING", 15, [["Butter Chicken", 1], ["Jeera Rice", 1], ["Sweet Lassi", 2]]);
    const t3 = await session(2, 4, 55);
    await order(t3.id, "SERVED", 50, [["Kadhai Paneer", 1], ["Butter Naan", 6], ["Masala Chai", 4]]);

    // Past bills, paid, so the sales report has something to show.
    const past: [number, number, [string, number][], string][] = [
      [3, 2, [["Chicken Tikka", 1], ["Butter Naan", 2], ["Gulab Jamun", 2]], "UPI"],
      [4, 4, [["Dal Makhani", 2], ["Jeera Rice", 2], ["Veg Manchurian", 1], ["Sweet Lassi", 4]], "CASH"],
      [5, 2, [["Masala Papad", 2], ["Butter Chicken", 1], ["Butter Naan", 3]], "UPI"],
    ];
    for (const [index, [tableIndex, party, lines, method]] of past.entries()) {
      const minutes = 90 + index * 1500;
      const paid = await session(tableIndex, party, minutes, "PAID");
      await order(paid.id, "SERVED", minutes - 5, lines);
      await freezeBill(tx, paid.id, shop.id);
      await tx.tableSession.update({ where: { id: paid.id }, data: { paidMethod: method, paidAt: ago(minutes - 60) } });
    }
    await tx.orderingSettings.update({ where: { shopId: shop.id }, data: { version: { increment: 1 } } });
    await tx.auditLog.create({ data: { userId: adminId, shopId: shop.id, action: "restaurant.demo_create", entityType: "Shop", entityId: shop.id } });
    return shop.id;
  }, { timeout: 30_000, maxWait: 10_000 });

  return { shopId, logins: staff.map((person) => ({ role: person.role, name: person.name, login: person.login, password: person.password })) };
}
