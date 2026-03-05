import { db } from "./index";
import { exercises, muscle_groups } from "./schema";

const groups = [
  {
    name: "Chest",
    vietnamese_trans: "Ngực",
    color_hex: "#E74C3C",
    exercises: [
      { name: "Bench Press", vietnamese_trans: "Đẩy ngực nằm" },
      { name: "Incline Dumbbell Press", vietnamese_trans: "Đẩy tạ đơn nghiêng" },
      { name: "Push Up", vietnamese_trans: "Hít đất" },
    ],
  },
  {
    name: "Back",
    vietnamese_trans: "Lưng",
    color_hex: "#2980B9",
    exercises: [
      { name: "Pull Up", vietnamese_trans: "Kéo xà" },
      { name: "Bent Over Row", vietnamese_trans: "Chèo thuyền cúi" },
      { name: "Lat Pulldown", vietnamese_trans: "Kéo xà cáp" },
    ],
  },
  {
    name: "Tricep",
    vietnamese_trans: "Cơ tam đầu",
    color_hex: "#E67E22",
    exercises: [
      { name: "Tricep Dips", vietnamese_trans: "Chống tay sau" },
      { name: "Skull Crusher", vietnamese_trans: "Đẩy tạ sau đầu" },
      { name: "Tricep Pushdown", vietnamese_trans: "Kéo cáp tam đầu" },
    ],
  },
  {
    name: "Bicep",
    vietnamese_trans: "Cơ nhị đầu",
    color_hex: "#8E44AD",
    exercises: [
      { name: "Barbell Curl", vietnamese_trans: "Curl tạ đòn" },
      { name: "Hammer Curl", vietnamese_trans: "Curl búa" },
      { name: "Concentration Curl", vietnamese_trans: "Curl tập trung" },
    ],
  },
  {
    name: "Quad",
    vietnamese_trans: "Cơ đùi trước",
    color_hex: "#27AE60",
    exercises: [
      { name: "Squat", vietnamese_trans: "Ngồi xổm" },
      { name: "Leg Press", vietnamese_trans: "Ép chân" },
      { name: "Leg Extension", vietnamese_trans: "Duỗi chân" },
    ],
  },
  {
    name: "Hamstring",
    vietnamese_trans: "Cơ đùi sau",
    color_hex: "#16A085",
    exercises: [
      { name: "Romanian Deadlift", vietnamese_trans: "Deadlift Romania" },
      { name: "Leg Curl", vietnamese_trans: "Curl chân" },
      { name: "Stiff Leg Deadlift", vietnamese_trans: "Deadlift chân thẳng" },
    ],
  },
  {
    name: "Shoulder",
    vietnamese_trans: "Vai",
    color_hex: "#F39C12",
    exercises: [
      { name: "Overhead Press", vietnamese_trans: "Đẩy trên đầu" },
      { name: "Lateral Raise", vietnamese_trans: "Nâng tạ bên" },
      { name: "Front Raise", vietnamese_trans: "Nâng tạ trước" },
    ],
  },
  {
    name: "Glute",
    vietnamese_trans: "Cơ mông",
    color_hex: "#C0392B",
    exercises: [
      { name: "Hip Thrust", vietnamese_trans: "Đẩy hông" },
      { name: "Glute Bridge", vietnamese_trans: "Cầu mông" },
      { name: "Cable Kickback", vietnamese_trans: "Đá chân cáp" },
    ],
  },
  {
    name: "Calf",
    vietnamese_trans: "Bắp chân",
    color_hex: "#2C3E50",
    exercises: [
      { name: "Standing Calf Raise", vietnamese_trans: "Nhón chân đứng" },
      { name: "Seated Calf Raise", vietnamese_trans: "Nhón chân ngồi" },
    ],
  },
  {
    name: "Abs",
    vietnamese_trans: "Bụng",
    color_hex: "#1ABC9C",
    exercises: [
      { name: "Crunch", vietnamese_trans: "Gập bụng" },
      { name: "Plank", vietnamese_trans: "Tư thế ván" },
      { name: "Leg Raise", vietnamese_trans: "Nâng chân" },
    ],
  },
];

for (const group of groups) {
  const [inserted] = db
    .insert(muscle_groups)
    .values({
      name: group.name,
      vietnamese_trans: group.vietnamese_trans,
      color_hex: group.color_hex,
    })
    .returning()
    .all();

  db.insert(exercises)
    .values(
      group.exercises.map((e) => ({
        name: e.name,
        vietnamese_trans: e.vietnamese_trans,
        muscle_group_id: inserted.id,
      })),
    )
    .run();

  console.log(`Seeded: ${group.name} (${group.exercises.length} exercises)`);
}

console.log("Done.");
