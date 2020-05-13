const express = require("express");
const router = express.Router();
const commentRouter = require("./comments");
const auth = require("../middlewares/auth");

//Require Models
const Article = require("../models/article");
const Comment = require("../models/comment");

//Routes

// List all articles form database
router.get("/", (req, res, next) => {
	Article.find({}, (err, listArticles) => {
		if (err) return next(err);
		res.render("articles", { articles: listArticles });
	});
});

// Routes visible to the logged-in user only
router.use(auth.checkedUserLogged);

// Add form
router.get("/new", (req, res) => {
	res.render("articleForm");
});

// Create article
router.post("/new", (req, res, next) => {
	//grab body data
	req.body.author = req.user.id;
	req.body.tags = req.body.tags.split(",");
	console.log(req.body);
	//save the data to the database
	Article.create(req.body, (err, data) => {
		if (err) return next(err);
		//sending response to the client
		res.redirect("/articles");
	});
});

// Get a single article form database
router.get("/:articleId", (req, res, next) => {
	let articleId = req.params.articleId;
	Article.findById(articleId)
		.populate("comments")
		.exec((err, article) => {
			if (err) return next(err);
			if (!article)
				return res.json({ success: false, message: "Invalid Article ID" });
			res.render("articleDetails", { article });
		});
});

//Creating a comment
router.post("/:articleId/comments", (req, res) => {
	var articleId = req.params.articleId;
	req.body.articleId = articleId;
	Comment.create(req.body, (err, createdComment) => {
		if (err) return next(err);
		// update article's comment array with nelwy created comment
		Article.findByIdAndUpdate(
			articleId,
			{ $push: { comments: createdComment.id } },
			(err, article) => {
				if (err) {
					return next(err);
				}
				res.redirect(`/articles/${articleId}`);
			}
		);
	});
});

//Comment edit form
router.get("/:articleId/comments/:commentId/edit", (req, res, next) => {
	var commentId = req.params.commentId;
	Comment.findById(commentId, (err, comment) => {
		if (err) return next(err);
		res.render("editCommentForm", { comment });
	});
});

//Delete comment
router.get("/:articleId/comments/:commentId/delete", (req, res, next) => {
	var articleId = req.params.articleId;
	var commentId = req.params.commentId;
	Comment.findByIdAndDelete(commentId, (err, deletedArticle) => {
		if (err) return next(err);
		Article.findByIdAndUpdate(
			articleId,
			{ $pull: { comments: commentId } },
			(err, updatedAticle) => {
				if (err) return next(err);
				res.redirect(`/articles/${articleId}`);
			}
		);
	});
});

//Updated comments
router.post("/:articleId/comments/:commentId", (req, res, next) => {
	var articleId = req.params.articleId;
	var commentId = req.params.commentId;
	console.log(req.body);
	Comment.findByIdAndUpdate(
		commentId,
		{ runValidators: true },
		req.body,
		(err, updatedComment) => {
			if (err) return next(err);
			res.redirect(`/articles/${articleId}`);
		}
	);
});

// Update Article form
router.get("/:id/edit", (req, res) => {
	Article.findById(req.params.id, (err, article) => {
		if (err) return next(err);
		res.render("updateArticleForm", { article });
	});
});

// Display updated data
router.post("/:articleId", (req, res, next) => {
	let id = req.params.articleId;
	Article.findByIdAndUpdate(
		id,
		req.body,
		// { runValidators: true },
		{ new: true },
		(err, article) => {
			if (err) return next(err);
			res.render("articleDetails", { article });
		}
	);
});

// Likes and Dislikes
router.get("/:articleId/likes", (req, res, next) => {
	var articleId = req.params.articleId;
	Article.findByIdAndUpdate(
		articleId,
		{ $inc: { likes: 1 } },
		(err, article) => {
			if (err) return next(err);
			res.redirect(`/articles/${articleId}`);
		}
	);
});

router.get("/:articleId/dislikes", (req, res, next) => {
	var articleId = req.params.articleId;
	Article.findByIdAndUpdate(
		articleId,
		{ $inc: { likes: -1 } },
		(err, article) => {
			if (err) return next(err);
			res.redirect(`/articles/${articleId}`);
		}
	);
});

//Comment router middleware
// router.use("/", commentRouter);
router.post("/:articleId/comments", (req, res) => {
	console.log(req.body);
});

// Delete a Article
router.get("/:articleId/delete", (req, res) => {
	var articleId = req.params.articleId;
	Article.findByIdAndDelete(articleId, (err, articleDeleted) => {
		if (err) return next(err);
		Comment.deleteMany({ articleId }, (err, deletedMessage) => {
			if (err) next(err);
			console.log(err, deletedMessage);
			res.redirect("/articles");
		});
	});
});

module.exports = router;
