import { act } from "react";
import { createRoot } from "react-dom/client";
import { EquipmentCart } from "./EquipmentCart";

const setInputValue = (input, value) => {
  const descriptor = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  );

  descriptor.set.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
};

describe("EquipmentCart", () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("shows totals and forwards quantity and remove actions", async () => {
    const handleRemove = jest.fn();
    const handleUpdateQuantity = jest.fn();

    await act(async () => {
      root.render(
        <EquipmentCart
          items={[
            {
              id: "projector-1",
              name: "Projector",
              categoryName: "Visual",
              pricePerDay: 4000,
              quantity: 2,
              totalPrice: 8000,
            },
          ]}
          onRemove={handleRemove}
          onUpdateQuantity={handleUpdateQuantity}
        />,
      );
    });

    expect(container.textContent).toContain("Projector");
    expect(container.textContent).toContain("Equipment total: PKR 8,000.00");

    const quantityInput = container.querySelector(
      'input[aria-label="Quantity for Projector"]',
    );

    await act(async () => {
      setInputValue(quantityInput, "3");
    });

    expect(handleUpdateQuantity).toHaveBeenCalledWith(0, 3);

    const removeButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Remove Projector",
    );

    await act(async () => {
      removeButton.click();
    });

    expect(handleRemove).toHaveBeenCalledWith(0);
  });
});
