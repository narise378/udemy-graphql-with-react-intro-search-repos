import React, { Component } from 'react'
import { ApolloProvider, Mutation, Query } from 'react-apollo'
import client from './client'
import { ADD_STAR, RMOVE_STAR, SEARCH_REPOSITORIES } from './grapql'

const StarButton = (props) => {
  const { node, query, first, last, before, after } = props
  const totalCount = node.stargazers.totalCount
  const viewerHasStarred = node.viewerHasStarred
  const starCount = totalCount === 1 ? '1 Star' : `${totalCount} Stars`

  const StartStatus = ({ addOrRemoveStar }) => {
    return (
      <button
        onClick={() =>
          addOrRemoveStar({
            variables: { input: { starrableId: node.id } },
            update: (store, { data: { addStar, removeStar } }) => {
              const { starrable } = addStar || removeStar
              console.log({ starrable })
              const data = store.readQuery({
                query: SEARCH_REPOSITORIES,
                variables: { query, first, last, before, after },
              })
              const edges = data.search.edges
              const newEdges = edges.map((edge) => {
                if (edge.node.id === node.id) {
                  const totalCount = edge.node.stargazers.totalCount
                  const diff = starrable.viewerHasStarred ? 1 : -1
                  const newTotalCount = totalCount + diff
                  edge.node.stargazers.totalCount = newTotalCount
                }
                return edge
              })
              data.search.edges = newEdges
              store.writeQuery({ query: SEARCH_REPOSITORIES, data })
            },
          })
        }
      >
        {starCount} | {viewerHasStarred ? 'starred' : '-'}
      </button>
    )
  }

  return (
    <Mutation mutation={viewerHasStarred ? RMOVE_STAR : ADD_STAR}>
      {(addOrRemoveStar) => <StartStatus addOrRemoveStar={addOrRemoveStar} />}
    </Mutation>
  )
}

const PER_PAGE = 5
const DEFAULT_STATE = {
  first: PER_PAGE,
  after: null,
  last: null,
  before: null,
  query: 'フロントエンドエンジニア',
}
class App extends Component {
  constructor(props) {
    super(props)

    this.state = DEFAULT_STATE
    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleChange(event) {
    this.setState({
      ...DEFAULT_STATE,
      query: event.target.value,
    })
  }

  handleSubmit(event) {
    event.preventDefault()
  }

  goNext(search) {
    this.setState({
      first: PER_PAGE,
      after: search.pageInfo.endCursor,
      last: null,
      before: null,
    })
  }

  goPrev(search) {
    this.setState({
      first: null,
      after: null,
      last: PER_PAGE,
      before: search.pageInfo.startCursor,
    })
  }

  render() {
    const { query, first, last, before, after } = this.state
    console.log({ query })

    return (
      <ApolloProvider client={client}>
        <div>Hello GraphQL</div>
        <from onSubmit={this.handleSubmit}>
          <input value={query} onChange={this.handleChange} />
        </from>
        <Query
          query={SEARCH_REPOSITORIES}
          variables={{ query, first, last, before, after }}
        >
          {({ loading, error, data }) => {
            if (loading) return 'Loading...'
            if (error) return `Error! ${error.message}`

            const search = data.search
            const repositoryCount = search.repositoryCount
            const repositoryUnit =
              repositoryCount === 1 ? 'Repository' : 'Repositorys'
            const title = `GitHub Repositories Search Reults - ${repositoryCount} ${repositoryUnit}`

            return (
              <React.Fragment>
                <h2>{title}</h2>
                <ul>
                  {search.edges.map((edge) => {
                    const node = edge.node
                    return (
                      <li key={node.id}>
                        <a
                          href={node.url}
                          target="__blank"
                          rel="noopener noreferrer"
                        >
                          {node.name}
                        </a>
                        &nbsp;
                        <StarButton
                          node={node}
                          {...{ query, first, last, before, after }}
                        />
                      </li>
                    )
                  })}
                </ul>
                {search.pageInfo.hasPreviousPage === true ? (
                  <button onClick={this.goPrev.bind(this, search)}>Prev</button>
                ) : null}
                {search.pageInfo.hasNextPage === true ? (
                  <button onClick={this.goNext.bind(this, search)}>Next</button>
                ) : null}
              </React.Fragment>
            )
          }}
        </Query>
      </ApolloProvider>
    )
  }
}

export default App
