// 作用：更新卡片的标题、描述等信息
// router.put("/:id", auth, async (req, res) => {
// const cardId = req.params.id;
// const userId = req.user.id;
// const { title, description, listId, order } = req.body; // 从请求体中获取要更新的数据

// // 这里我们允许只更新部分字段，所以不做强制要求
// if (title === undefined && description === undefined) {
// return res.status(400).json({ msg: "没有提供任何要更新的数据" });
// }

// try {
// // 同样需要进行权限验证
// const authQuery = `//             SELECT c.id
//             FROM cards c
//             JOIN lists l ON c.list_id = l.id
//             JOIN boards b ON l.board_id = b.id
//             WHERE c.id = $1 AND b.user_id = $2
//        `;
// const authResult = await db.query(authQuery, [cardId, userId]);

// if (authResult.rows.length === 0) {
// return res.status(403).json({ msg: "无权更新此卡片或卡片不存在" });
// }

// // 构建动态的更新查询语句
// // 这样可以灵活地只更新传入的字段
// // const fields = [];
// const updates = [];
// const values = [];
// let queryIndex = 1;

// if (title !== undefined) {
// updates.push(`title = $${queryIndex++}`);
// values.push(title);
// }
// if (description !== undefined) {
// updates.push(`description = $${queryIndex++}`);
// values.push(description);
// }
// if (listId !== undefined) {
// updates.push(`listId = $${queryIndex++}`);
// values.push(listId);
// }
// if (order !== undefined) {
// updates.push(`order = $${queryIndex++}`);
// values.push(order);
// }

// if (updates.length === 0) {
// return res.status(400).json({ msg: "没有提供任何要更新的字段" });
// }

// // values.push(cardId); // WHERE 条件里的 cardId
// values.push(req.params.id); // 把 cardId 加到值数组的最后
// const updateQuery = `UPDATE cards SET ${updates.join(
//       ", "
//     )} WHERE id = $${queryIndex} RETURNING *`; // 别忘了权限检查

// const updatedCardResult = await db.query(updateQuery, values);

// res.json(updatedCardResult.rows[0]);
// } catch (err) {
// console.error(`更新卡片 ${cardId} 时出错:`, err);
// res.status(500).json({ error: "服务器内部错误" });
// }
// });
