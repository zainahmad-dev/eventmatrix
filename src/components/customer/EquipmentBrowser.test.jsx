import { act } from "react";
import { createRoot } from "react-dom/client";
import { EquipmentBrowser } from "./EquipmentBrowser";
import { fetchCategories, fetchEquipment } from "../../api/equipment";

jest.mock("../../api/equipment", () => ({
  fetchCategories: jest.fn(),
  fetchEquipment: jest.fn(),
}));

const setInputValue = (input, value) => {
  const descriptor = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  );

  descriptor.set.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
};

describe("EquipmentBrowser", () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    fetchCategories.mockResolvedValue([
      { id: "audio", name: "Audio", icon: "🎤" },
    ]);
    fetchEquipment.mockResolvedValue([
      {
        id: "speaker-1",
        name: "Wireless Speaker",
        category: { id: "audio", name: "Audio" },
        availableQuantity: 3,
        pricePerDay: 2500,
        condition: "good",
      },
      {
        id: "speaker-2",
        name: "Backup Speaker",
        category: { id: "audio", name: "Audio" },
        availableQuantity: 0,
        pricePerDay: 1800,
        condition: "good",
      },
      {
        id: "speaker-3",
        name: "Repair Queue Speaker",
        category: { id: "audio", name: "Audio" },
        availableQuantity: 2,
        pricePerDay: 1200,
        condition: "under-maintenance",
      },
    ]);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    jest.clearAllMocks();
  });

  it("loads available equipment and adds the selected quantity to the cart", async () => {
    const handleAddToCart = jest.fn();

    await act(async () => {
      root.render(
        <EquipmentBrowser
          eventDate="2026-06-01"
          onAddToCart={handleAddToCart}
        />,
      );
    });

    expect(fetchEquipment).toHaveBeenCalledWith({
      endDate: "2026-06-01",
      startDate: "2026-06-01",
    });

    expect(container.textContent).toContain("Wireless Speaker");
    expect(container.textContent).not.toContain("Backup Speaker");
    expect(container.textContent).not.toContain("Repair Queue Speaker");

    const quantityInput = container.querySelector(
      'input[aria-label="Quantity for Wireless Speaker"]',
    );

    await act(async () => {
      setInputValue(quantityInput, "2");
    });

    const addButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Add to cart",
    );

    await act(async () => {
      addButton.click();
    });

    expect(handleAddToCart).toHaveBeenCalledWith({
      categoryName: "Audio",
      id: "speaker-1",
      name: "Wireless Speaker",
      pricePerDay: 2500,
      quantity: 2,
      totalPrice: 5000,
    });
  });
});
