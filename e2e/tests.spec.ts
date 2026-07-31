import { expect, test } from "@playwright/test";

test.describe("Kanban board", () => {
  test("creates, edits, moves, filters, persists, and deletes a task", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    await page.goto("/");
    await expect(page.getByText(/Guest [a-z0-9-]+/i).first()).toBeVisible();

    await page.getByRole("button", { name: /new task/i }).click();
    await page.getByPlaceholder("Example: Write feature spec").fill("E2E Task");
    await page.getByPlaceholder(/Add context/i).fill("Acceptance test description");
    await page.getByLabel("Due date").fill(new Date().toISOString().slice(0, 10));
    await page.getByRole("dialog").getByRole("combobox").first().selectOption("high");
    await page.getByRole("button", { name: "Add task" }).click();

    const taskHeading = page.getByRole("heading", { name: "E2E Task" });
    await expect(taskHeading).toBeVisible();

    const card = taskHeading.locator("xpath=ancestor::article");
    await card.getByRole("button", { name: "Edit" }).click();
    await page.getByPlaceholder("Example: Write feature spec").fill("E2E Task Edited");
    await page.getByRole("button", { name: "Save task" }).click();
    await expect(page.getByRole("heading", { name: "E2E Task Edited" })).toBeVisible();

    const editedCard = page.getByRole("heading", { name: "E2E Task Edited" }).locator("xpath=ancestor::article");
    await editedCard.getByRole("combobox").selectOption("in_progress");
    await expect(page.locator('[aria-labelledby="column-in_progress"]').getByRole("heading", { name: "E2E Task Edited" })).toBeVisible();

    await page.getByPlaceholder("Search tasks…").fill("edited");
    await expect(page.getByRole("heading", { name: "E2E Task Edited" })).toBeVisible();
    await page.getByLabel("Filter by priority").selectOption("low");
    await expect(page.getByRole("heading", { name: "E2E Task Edited" })).toHaveCount(0);
    await page.getByLabel("Filter by priority").selectOption("all");

    await page.reload();
    await expect(page.getByRole("heading", { name: "E2E Task Edited" })).toBeVisible();
    await page.getByRole("heading", { name: "E2E Task Edited" }).locator("xpath=ancestor::article").getByRole("button", { name: "Delete" }).click();
    await page.reload();
    await expect(page.getByRole("heading", { name: "E2E Task Edited" })).toHaveCount(0);
    expect(consoleErrors).toEqual([]);
  });
});
