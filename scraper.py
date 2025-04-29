import requests
from bs4 import BeautifulSoup
import json
import time
from datetime import datetime
import random
import re

class ProductScraper:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
        }
        self.results = {}

    def scrape_amazon(self, query):
        try:
            url = f"https://www.amazon.in/s?k={query.replace(' ', '+')}"
            response = requests.get(url, headers=self.headers)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find the first product
            product = soup.find('div', {'data-component-type': 's-search-result'})
            if not product:
                return None

            # Extract product details
            title = product.find('span', {'class': 'a-text-normal'}).text.strip()
            price_element = product.find('span', {'class': 'a-price-whole'})
            price = float(price_element.text.replace(',', '')) if price_element else None
            
            # Get product URL
            product_url = "https://www.amazon.in" + product.find('a', {'class': 'a-link-normal'})['href']
            
            # Get rating
            rating_element = product.find('span', {'class': 'a-icon-alt'})
            rating = float(rating_element.text.split()[0]) if rating_element else None
            
            # Get review count
            review_count_element = product.find('span', {'class': 'a-size-base'})
            review_count = int(review_count_element.text.replace(',', '')) if review_count_element else None

            return {
                'title': title,
                'price': price,
                'url': product_url,
                'rating': rating,
                'review_count': review_count,
                'source': 'amazon'
            }
        except Exception as e:
            print(f"Error scraping Amazon: {str(e)}")
            return None

    def scrape_flipkart(self, query):
        try:
            url = f"https://www.flipkart.com/search?q={query.replace(' ', '%20')}"
            response = requests.get(url, headers=self.headers)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find the first product
            product = soup.find('div', {'class': '_1AtVbE'})
            if not product:
                return None

            # Extract product details
            title = product.find('div', {'class': '_4rR01T'}).text.strip()
            price_element = product.find('div', {'class': '_30jeq3'})
            price = float(price_element.text.replace('₹', '').replace(',', '')) if price_element else None
            
            # Get product URL
            product_url = "https://www.flipkart.com" + product.find('a', {'class': '_1fQZEK'})['href']
            
            # Get rating
            rating_element = product.find('div', {'class': '_3LWZlK'})
            rating = float(rating_element.text) if rating_element else None
            
            # Get review count
            review_count_element = product.find('span', {'class': '_2_R_DZ'})
            review_count = int(review_count_element.text.split()[0].replace(',', '')) if review_count_element else None

            return {
                'title': title,
                'price': price,
                'url': product_url,
                'rating': rating,
                'review_count': review_count,
                'source': 'flipkart'
            }
        except Exception as e:
            print(f"Error scraping Flipkart: {str(e)}")
            return None

    def scrape_croma(self, query):
        try:
            url = f"https://www.croma.com/search?q={query.replace(' ', '%20')}"
            response = requests.get(url, headers=self.headers)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find the first product
            product = soup.find('div', {'class': 'product-item'})
            if not product:
                return None

            # Extract product details
            title = product.find('h3', {'class': 'product-title'}).text.strip()
            price_element = product.find('span', {'class': 'amount'})
            price = float(price_element.text.replace('₹', '').replace(',', '')) if price_element else None
            
            # Get product URL
            product_url = "https://www.croma.com" + product.find('a', {'class': 'product-item-link'})['href']
            
            # Get rating
            rating_element = product.find('div', {'class': 'rating-box'})
            rating = float(rating_element.text) if rating_element else None
            
            # Get review count
            review_count_element = product.find('span', {'class': 'review-count'})
            review_count = int(review_count_element.text.replace(',', '')) if review_count_element else None

            return {
                'title': title,
                'price': price,
                'url': product_url,
                'rating': rating,
                'review_count': review_count,
                'source': 'croma'
            }
        except Exception as e:
            print(f"Error scraping Croma: {str(e)}")
            return None

    def scrape_all(self, query):
        print(f"\nSearching for: {query}")
        print("-" * 50)
        
        # Scrape from all sources
        amazon_data = self.scrape_amazon(query)
        time.sleep(2)  # Add delay between requests
        flipkart_data = self.scrape_flipkart(query)
        time.sleep(2)
        croma_data = self.scrape_croma(query)

        # Store results
        self.results = {
            'amazon': amazon_data,
            'flipkart': flipkart_data,
            'croma': croma_data,
            'timestamp': datetime.now().isoformat()
        }

        # Print results
        self.print_results()

    def print_results(self):
        print("\nResults:")
        print("-" * 50)
        
        for source, data in self.results.items():
            if source == 'timestamp':
                continue
                
            if data:
                print(f"\n{source.upper()}:")
                print(f"Title: {data['title']}")
                print(f"Price: ₹{data['price']:,.2f}" if data['price'] else "Price: N/A")
                print(f"Rating: {data['rating']}/5" if data['rating'] else "Rating: N/A")
                print(f"Reviews: {data['review_count']:,}" if data['review_count'] else "Reviews: N/A")
                print(f"URL: {data['url']}")
            else:
                print(f"\n{source.upper()}: No data available")

        print(f"\nData collected at: {self.results['timestamp']}")

def main():
    scraper = ProductScraper()
    
    while True:
        query = input("\nEnter product to search (or 'quit' to exit): ")
        if query.lower() == 'quit':
            break
            
        scraper.scrape_all(query)
        
        # Ask if user wants to save results
        save = input("\nDo you want to save these results? (y/n): ")
        if save.lower() == 'y':
            filename = f"product_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(filename, 'w') as f:
                json.dump(scraper.results, f, indent=2)
            print(f"Results saved to {filename}")

if __name__ == "__main__":
    main() 