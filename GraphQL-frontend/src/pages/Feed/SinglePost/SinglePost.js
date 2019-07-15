import React, {Component} from 'react';

import Image from '../../../components/Image/Image';
import './SinglePost.css';
import axios from '../../../axios';
import {host} from '../../../util/appUtil';

class SinglePost extends Component {
    state = {
        title: '',
        author: '',
        date: '',
        image: '',
        content: ''
    };

    componentDidMount() {
        const postId = this.props.match.params.postId;
        axios.get(`/feed/post/${postId}`, {headers: {Authorization: `Bearer ${this.props.token}`}})
            .then(res => {
                if (res.status !== 200) throw new Error('Failed to fetch status');
                this.setState({
                    title: res.data.post.title,
                    author: res.data.post.creator.name,
                    image: host + res.data.post.imageUrl,
                    date: new Date(res.data.post.createdAt).toLocaleDateString('en-US'),
                    content: res.data.post.content
                });
            })
            .catch(e => console.log(e));
    }

    render() {
        return (
            <section className="single-post">
                <h1>{this.state.title}</h1>
                <h2>
                    Created by {this.state.author} on {this.state.date}
                </h2>
                <div className="single-post__image">
                    <Image contain imageUrl={this.state.image}/>
                </div>
                <p>{this.state.content}</p>
            </section>
        );
    }
}

export default SinglePost;
