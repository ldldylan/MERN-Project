import { useParams, useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { fetchUser } from "../../store/users";
import artworksReducer, { fetchUserArtworks } from "../../store/artworks";
import NavBar from "../NavBar/NavBar";
import Footer from "../Footer/Footer";
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import EmailIcon from '@mui/icons-material/Email';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import { addNewCartItem } from '../../store/cartItems';
import { fetchCartItems } from '../../store/cartItems';
import './User.css'
import Loading from '../Loading/Loading'

function User() {
    const dispatch = useDispatch();
    const { userId } = useParams();
    const user = useSelector(state => state.users[userId])
    const artworks = useSelector((state) => state.artworks);
    const history = useHistory();
    const currentUser = useSelector((state) => state.session.user)
    const cartItems = useSelector((state) => state.cartItems)
    const [loaded, setLoaded] = useState(false);
    const [showToolTip, setShowToolTip] = useState(false);
    const [timeoutId, setTimeoutId] = useState(null);
    const [favorites, setFavorites] = useState({});

    const toggleFavorite = (artworkId) => {
        setFavorites(prevFavorites => ({
            ...prevFavorites,
            [artworkId]: !prevFavorites[artworkId]
        }));
    }

    useEffect(() => {
        Promise.all([

            dispatch(fetchUser(userId)),
            dispatch(fetchUserArtworks(userId)),
            dispatch(fetchCartItems()),
        ]).then(() => {
            setLoaded(true);
        })
    }, [dispatch, userId])

    const [shouldFetchArtworks, setShouldFetchArtworks] = useState(true);
    const updateShouldFetchArtworks = (newValue) => {
        setShouldFetchArtworks(newValue);
    };
    // useEffect(() => {
    //     if (shouldFetchArtworks) {
    //         dispatch(fetchUserArtworks(userId));
    //         setShouldFetchArtworks(false);
    //     }
    // }, [dispatch, shouldFetchArtworks, userId]);

    const [isLiked, setIsLiked] = useState(false);
    const handleLikeClick = () => {
        setIsLiked(!isLiked);
    };

    const handleAddCartItem = (e, artworkId) => {
        e.preventDefault();
        if (currentUser) {
            const artworkArray = Object.values(cartItems).map((item) => item.artwork);
            if (!artworkArray.includes(artworkId))
                dispatch(addNewCartItem({ artwork: artworkId }, currentUser._id));
            else alert('Artwork is already in your cart!')
        }
        else {
            history.push('/login')
        };
    }
    if (!loaded) {
        return (
            <>
                <NavBar />
                <Loading />
            </>

        )
    } else {
        return (<>
            <NavBar updateShouldFetchArtworks={updateShouldFetchArtworks} />
            {showToolTip && <div className="tooltip">Artwork added to cart!</div>}
            <div className="user">
                <div className="user-main">
                    <div className="user-image-container">
                        <img
                            src={user?.profileImageUrl ? user.profileImageUrl : null}
                            style={{
                                backgroundRepeat: "no-repeat",
                                backgroundSize: "contain",
                                backgroundPosition: "center",
                                objectFit: "cover"
                            }}
                            className="user-image" />
                        {currentUser._id !== userId ? (<>
                        <button className="msg-user-button"><EmailIcon /></button>
                        <button className="like-user-button"
                            onClick={handleLikeClick}
                            style={{ color: isLiked ? 'blue' : 'white' }}><ThumbUpIcon /></button>
                      </>): null}
                    </div>
                    <div className="user-info">
                        <div className="user-author">
                            Welcome to <br />
                            {user?.email ? user.email.split('@')[0] : "Mysterious Artist"}'s profile page
                        </div>
                    </div>
                </div>

                <div className="user-artworks-container">
                    {user?.email ? user.email.split('@')[0] : "Mysterious Artist"}'s Artworks
                    <div className="divider user-show" />
                    <ul className="user-artworks">
                        {/* {console.log(artworks ? artworks : null)} */}
                        {Object.keys(artworks).length === 0 ? null : Object.keys(artworks).map(key => (
                            artworks[key].author._id === userId ? (
                                <li key={artworks[key]._id} className="asset-item">
                                    <div>
                                        {/* <FavoriteBorderIcon className="favorite-item-icon" /> */}
                                        <div className="artwork-image-container">
                                            <img
                                                src={artworks[key]?.ArtworkImageUrl ?? null}
                                                style={{
                                                    display: "block",
                                                    margin: "0 auto",
                                                    backgroundRepeat: "no-repeat",
                                                    backgroundSize: "contain",
                                                    backgroundPosition: "center",
                                                    objectFit: "cover"
                                                }}
                                                className="artwork-preview-image-user-show"
                                                onClick={() => history.push(`/artworks/${artworks[key]._id}`)} />
                                        </div>
                                        <div onClick={() => toggleFavorite(artworks[key]._id)}>
                                            {favorites[artworks[key]._id] ?
                                                <FavoriteIcon style={{ color: "red" }} className="favorite-item-icon" fontSize="40" /> :
                                                <FavoriteBorderIcon className="favorite-item-icon" fontSize="40px" />}
                                        </div>
                                        <div className="artwork-name"
                                            onClick={() => history.push(`/artworks/${artworks[key]._id}`)}><p>{artworks[key].name}</p></div>
                                        <div className="artwork-artist">{artworks[key]?.author?.email?.split('@')[0] ? artworks[key]?.author.email.split('@')[0] : null}</div>
                                        <div className="artwork-price-cart">
                                            <div className="artwork-price"><p>${artworks[key].price.toFixed(2)}</p></div>
                                            <div className="artwork-cart"
                                                onClick={artworks[key]?._id ? (e) => {
                                                    clearTimeout(timeoutId);
                                                    handleAddCartItem(e, artworks[key]._id);
                                                    setShowToolTip(true);
                                                    const newTimeoutId = setTimeout(() => {
                                                        setShowToolTip(false);
                                                    }, 2500);
                                                    setTimeoutId(newTimeoutId);
                                                } : null}>
                                                <AddShoppingCartIcon />
                                            </div>
                                        </div>

                                    </div>
                                </li>
                            ) : null
                        ))}
                    </ul>
                </div>
            </div>
            <Footer />
        </>);
    }
}

export default User;