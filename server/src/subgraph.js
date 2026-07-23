// 获取graph 子图的数据，存到depositeds 数据表

const {request, gql} = require('graphql-request')

async function fetchDepositeds() {
    const query = gql`
        {
            depositeds(first: 100) {
                id
                orderId
                user
                token
                amount
                maturityTime
                blockNumber
                blockTimestamp
                transactionHash
            }
        }
    `
    return request(process.env.SUBGRAPH_URL, query)
}

module.exports = {
    fetchDepositeds
}