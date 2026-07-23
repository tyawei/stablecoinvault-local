// 在数据库查询

// 查询depositeds 表
async function queryDepositeds(db) {
    const result = await db.query(
        `SELECT 
            id, order_id, user_address, token_address, amount, maturity_time, block_number,
            block_timestamp, tx_hash, created_at
        FROM depositeds`
    );
    return result.rows;
}

module.exports = {
    queryDepositeds
};