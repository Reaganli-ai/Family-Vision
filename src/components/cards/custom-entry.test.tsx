import { fireEvent, render, screen } from "@testing-library/react";
import TagSelectCard from "@/components/cards/TagSelectCard";
import HeroSelectCard from "@/components/cards/HeroSelectCard";

describe("Custom entry behavior", () => {
  it("auto-includes pending custom tag on confirm", () => {
    const onConfirm = vi.fn();
    render(
      <TagSelectCard
        question="测试标签选择"
        tags={["A", "B", "C"]}
        maxSelect={2}
        onConfirm={onConfirm}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "+ 自定义" }));
    fireEvent.change(screen.getByPlaceholderText("自定义..."), {
      target: { value: "我的自定义标签" },
    });
    fireEvent.click(screen.getByRole("button", { name: "确认 →" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith(["我的自定义标签"]);
  });

  it("auto-includes pending custom hero trait on confirm", () => {
    const onConfirm = vi.fn();
    render(<HeroSelectCard onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: /守信重诺/ }));
    fireEvent.click(screen.getByRole("button", { name: "+ 自定义" }));
    fireEvent.change(screen.getByPlaceholderText("输入自定义特质..."), {
      target: { value: "自我驱动" },
    });
    fireEvent.click(screen.getByRole("button", { name: "确认 →" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith(["守信重诺", "自我驱动"]);
  });
});
