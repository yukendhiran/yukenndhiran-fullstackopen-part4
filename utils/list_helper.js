const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
	const reducer = (sum, item) => {
		return sum + item
	}

	const blogsLikes = blogs.map(blogs => blogs.likes)
  
	return blogsLikes.reduce(reducer, 0)
}

const favoriteBlog = (blogs) => {
	const blogsLikes = blogs.map(blogs => blogs.likes)
	const largestIndex = blogsLikes.indexOf(Math.max(...blogsLikes))
	const largestinfo = blogs[largestIndex]

	return {
		title: largestinfo.title,
		author: largestinfo.author,
		likes: largestinfo.likes,
	}
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog 
}
