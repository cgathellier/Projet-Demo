import React from 'react';
import { instance as axios } from '../../axios.config';
import { PostType } from '../post/types';
import classes from './Feed.module.css';
import { UserContext } from '../../contexts/UserContext';
import { useAlertsDispatcher } from '../../contexts/AlertsContext';
import Post from '../post/Post';
import PostForm from '../postForm/PostForm';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import { FeedProps } from './types';

const Feed = (props: FeedProps) => {
	const { posts: propsPosts, profileId, updateProfile } = props;

	const { userContext } = React.useContext(UserContext);
	const setAlertsContext = useAlertsDispatcher();

	const [posts, setPosts] = React.useState<PostType[]>([]);
	const [postFormOpen, setPostFormOpen] = React.useState(false);

	const getAllPosts = async () => {
		try {
			if (updateProfile) {
				return updateProfile();
			}
			const res = await axios.get('/posts');
			if (res.status === 200) {
				setPosts(res.data);
			} else if (res.status === 500) {
				setAlertsContext({
					type: 'error',
					message: 'Impossible de charger les publications, merci de réessayer plus tard',
				});
			}
		} catch (error) {}
	};

	const openPostForm = () => {
		setPostFormOpen(true);
	};

	const closePostForm = (shouldRefreshPosts: boolean = false) => {
		setPostFormOpen(false);
		if (shouldRefreshPosts) {
			getAllPosts();
		}
	};

	React.useEffect(() => {
		if (propsPosts) {
			setPosts(propsPosts);
		} else {
			getAllPosts();
		}
	}, [propsPosts, profileId]);

	return (
		<div className={classes.feed}>
			{(!profileId || profileId === userContext?.id) && (
				<Paper elevation={0} className={classes.postFormTriggerContainer}>
					<Button className={classes.postFormTrigger} onClick={openPostForm} variant='outlined'>
						Créer une publication...
					</Button>
				</Paper>
			)}
			{posts.length > 0 ? (
				posts.map(post => <Post post={post} key={post.id} updateFeed={getAllPosts} />)
			) : (
				<span className={classes.noPosts}>Aucune publication à afficher</span>
			)}
			{postFormOpen && <PostForm open={postFormOpen} handleClose={closePostForm} />}
		</div>
	);
};

export default Feed;