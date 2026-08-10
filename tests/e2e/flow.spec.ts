import { test, expect } from "@playwright/test";

// เส้นทางหลักของ guest user: ค้นหา -> หน้าสินทรัพย์ -> เห็นสถานะบทวิเคราะห์ AI (ล็อกอินก่อน) -> เพิ่ม watchlist
// รันได้โดยไม่ต้องมี DB/Redis/provider key จริง (ทุก service degrade เป็น seed data ตาม docs/01 §8)
test.describe("guest flow: search -> symbol -> analysis -> watchlist", () => {
  test("search for AAPL and land on symbol page", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "ค้นหาหุ้น, ETF, ทองคำ…" }).click();

    const searchInput = page.getByLabel("ค้นหาสินทรัพย์");
    await expect(searchInput).toBeFocused();
    await searchInput.fill("AAPL");

    const result = page.getByRole("button", { name: /AAPL/ }).first();
    await expect(result).toBeVisible();
    await result.click();

    await expect(page).toHaveURL(/\/s\/AAPL/i);
  });

  test("symbol page shows AI analysis panel gated behind login", async ({ page }) => {
    await page.goto("/s/AAPL");

    const analysisCard = page.getByText("บทวิเคราะห์ AI").first();
    await expect(analysisCard).toBeVisible();

    await expect(page.getByText("เข้าสู่ระบบก่อนเพื่อสร้างบทวิเคราะห์")).toBeVisible();
    await expect(page.getByRole("button", { name: "เข้าสู่ระบบเพื่อสร้างบทวิเคราะห์" })).toBeDisabled();
  });

  test("add AAPL to guest watchlist and see it listed", async ({ page }) => {
    await page.goto("/watchlist");

    await page.getByRole("button", { name: "เพิ่มสินทรัพย์" }).first().click();

    const addDialog = page.getByRole("dialog", { name: "เพิ่มสินทรัพย์ที่ติดตาม" });
    await addDialog.getByLabel("ค้นหาสินทรัพย์").fill("AAPL");

    const addButton = addDialog.getByRole("button", { name: "เพิ่ม" }).first();
    await expect(addButton).toBeVisible();
    await addButton.click();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();

    await expect(page.getByText("AAPL").first()).toBeVisible();
  });
});
